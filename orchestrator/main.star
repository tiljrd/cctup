POSTGRES_MIN_CPU = 10
POSTGRES_MAX_CPU = 1000
POSTGRES_MIN_MEMORY = 32
POSTGRES_MAX_MEMORY = 1024

def run(plan, args):
    env = args.get("env", "dev")
    
    ethereum = import_module("github.com/LZeroAnalytics/ethereum-package@{}/main.star".format(env))
    postgres = import_module("github.com/tiljrd/postgres-package@{}/main.star".format(env))

    blockscout_port = 3333
    network_results = []
    forked_networks = []
    existing_networks = args.get("existing_networks", [])
    for existing_network in existing_networks:
        forked_network = existing_network["forked_network"]

        if not forked_network:
            ethereum_args = args.get("ethereum_args", {})
            ethereum_args["network_params"]["network_id"] = str(existing_network["id"])
            ethereum_args["participants"][0]["el_extra_env_vars"]["FORKING_RPC_URL"] = existing_network["fork_url"]
            ethereum_args["blockscout_params"]["service_name_suffix"] = existing_network["key"]
            ethereum_args["blockscout_params"]["port_frontend_override"] = blockscout_port
            blockscout_port += 1

            plan.print("Spinning up Ethereum network")
            ethereum_args["env"] = env
            ethereum_output = ethereum.run(plan, ethereum_args)
            first = ethereum_output.all_participants[0]
            network_results.append(ethereum_output)
            forked_network = create_forked_network_object(plan, ethereum_output, existing_network, ethereum_args)

        forked_networks.append(forked_network)

        plan.print("Using RPC URL: {}".format(forked_network["rpcUrls"][0]))

        plan.print("Rendering firehose template with RPC: {}".format(forked_network["rpcUrls"][0]))
        firehose_config = plan.render_templates(
            config={
                "firehose.yaml": struct(
                    template=read_file("templates/firehose.yaml.tmpl"),
                    data={
                        "rpc_url": forked_network["rpcUrls"][0]
                    }
                )
            },
            name="firehose-config"+forked_network["key"]
        )

    plan.print("Starting firehose container")
    firehose_service = plan.add_service(
        name="firehose",
        config=ServiceConfig(
            image="ghcr.io/streamingfast/firehose-ethereum:latest",
            ports={
                "grpc": PortSpec(number=9000, transport_protocol="TCP", wait="1m"),
                "api": PortSpec(number=10015, transport_protocol="TCP", wait="1m")
            },
            files = {
                "/tmp/config/": firehose_config
            },
            entrypoint = ["fireeth"],
            cmd=["start", "-c", "/tmp/config/firehose.yaml", "--advertise-block-features=base"]
        )
    )

    plan.print("Deploying subgraph with substream data source")

    postgres_output = postgres.run(
        plan,
        service_name="postgres",
        min_cpu=POSTGRES_MIN_CPU,
        max_cpu=POSTGRES_MAX_CPU,
        min_memory=POSTGRES_MIN_MEMORY,
        max_memory=POSTGRES_MAX_MEMORY,
        password="TestPassword12345678!",
        extra_env_vars={
            "POSTGRES_INITDB_ARGS": "-E UTF8 --locale=C"
        }
    )

    postgres_user = postgres_output.user
    postgres_password = postgres_output.password
    postgres_hostname = postgres_output.service.hostname
    postgres_database = postgres_output.database

    ipfs_output = plan.add_service(
        name="ipfs",
        config=ServiceConfig(
            image="ipfs/kubo:master-latest",
            ports={
                "rpc": PortSpec(number=5001, transport_protocol="TCP"),
                "p2p": PortSpec(number=4001, transport_protocol="TCP"),
                "gateway": PortSpec(number=8080, transport_protocol="TCP", application_protocol="http")
            }
        )
    )

    ipfs_ip = ipfs_output.ip_address
    ipfs_url = "{}:5001".format(ipfs_ip)

    networks = [
        struct(
            name = "mainnet",
            substreams_grpc = "http://{}:9000".format(firehose_service.ip_address),
            substreams_token = "",
            firehose_grpc = "http://{}:10015".format(firehose_service.ip_address),
            firehose_token = ""
        )
    ]

    graph_node_config = plan.render_templates(
        config={
            "config.toml": struct(
                template = read_file("templates/config.toml.tmpl"),
                data     = { "networks": networks },
            )
        },
        name="graph-node-config",
    )

    chain_names = [n.name for n in networks]
    disable_check_list = ",".join(chain_names)
    graph_output = plan.add_service(
        name="graph-node",
        config=ServiceConfig(
            image="graphprotocol/graph-node",
            ports={
                "http": PortSpec(number=8000, transport_protocol="TCP", application_protocol="http", wait=None),
                "ws": PortSpec(number=8001, transport_protocol="TCP", wait=None),
                "rpc": PortSpec(number=8020, transport_protocol="TCP", wait=None),
                "api": PortSpec(number=8030, transport_protocol="TCP", wait=None),
                "prometheus": PortSpec(number=8040, transport_protocol="TCP", wait=None)
            },
            env_vars = {
                "postgres_host": postgres_hostname,
                "postgres_user": postgres_user,
                "postgres_pass": postgres_password,
                "postgres_db": postgres_database,
                "GRAPH_NODE_FIREHOSE_DISABLE_EXTENDED_BLOCKS_FOR_CHAINS": disable_check_list,
                "GRAPH_LOG": "trace"
            },
            files={
                "/tmp/config/": graph_node_config
            },
            cmd=[
                "graph-node",
                "--config", "/tmp/config/config.toml",
                "--ipfs", ipfs_url,
                "--node-id", "block_ingestor_node"
            ]
        )
    )

    graph_services = struct(
        postgres = postgres_output,
        ipfs = ipfs_output,
        graph = graph_output
    )
    
    # Get graph-node endpoint from graph services
    graph_node_url = "http://{}:8020".format(graph_services.graph.ip_address)

    # Add indexer service for subgraph deployment
    indexer_service = plan.add_service(
        name="indexer",
        config=ServiceConfig(
            image="tiljordan/cctup-indexer:1.0.1",
            env_vars={
                "GRAPH_NODE_URL": graph_node_url,
                "IPFS_URL": "http://{}:5001".format(graph_services.ipfs.ip_address)
            }
        )
    )

    rpc_recipe = GetHttpRequestRecipe(
        endpoint="/",
        port_id="rpc",
    )
    plan.wait(
        service_name="graph-node",
        recipe=rpc_recipe,
        field="code",
        assertion="==",
        target_value=405,
        interval="2s",
        timeout="2m",
        description="Waiting for Graph node to be available"
    )

    # Deploy subgraph to graph node
    plan.print("Creating subgraph in graph node: {}".format(graph_node_url))
    plan.exec(
        service_name="indexer",
        recipe=ExecRecipe(
            command=["sh", "-c", "cd /app/subgraph && graph create --node {} cctup/indexer".format(graph_node_url)]
        )
    )

    plan.print("Deploying subgraph to graph node: {}".format(graph_node_url))
    plan.exec(
        service_name="indexer",
        recipe=ExecRecipe(
            command=["sh", "-c", "cd /app/subgraph && graph deploy --node {} --ipfs http://{}:5001 --version-label v0.0.1 cctup/indexer".format(graph_node_url, graph_services.ipfs.ip_address)]
        )
    )
    

    plan.print("Spinning up CCTUP UI")
    tomls_art = plan.render_templates(
        name   = "network-configs",
        config = {
            "/generated-network-config.yaml": struct(
                template = read_file("../templates/cctup-networks-configs-template.yaml"),
                data = {
                    "ForkedNetworks": forked_networks,
                    "ExistingNetworks": existing_networks
                }
            )
        }
    )
    cctup_ui_service = plan.add_service(
        name="cctup-ui",
        config=ServiceConfig(
            image="fravlaca/cctup-ui:1.0.0",
            env_vars = {
                "NEXT_PUBLIC_CCIP_CONFIG_FILE": "/generated-network-config.yaml",
                "HARDHAT_PRIVATE_KEY": args["deployer_private_key"]
            },
            ports={
                "http": PortSpec(number=3001, transport_protocol="TCP", wait="1m")
            },
            files = {
                "/public": tomls_art
            }
        )
    )

    plan.print("CCTUP Orchestrator deployment complete")
    
    return struct(
        forked_networks=forked_networks,
        existing_networks=existing_networks,
        graph_services=graph_services,
        firehose=firehose_service,
        graph_endpoint=graph_node_url
    )




def create_forked_network_object(ethereum_output, existing_network, ethereum_args):
    # Get the RPC URL from the ethereum output
    network_fork = {
        "id": ethereum_output.network_id,
        "key": existing_network["fork"],
        "name": existing_network["name"] + " Fork",
        "nativeCurrency": {
            "name": "Ethereum",
            "symbol": "ETH",
            "decimals": 18
        },
        "rpcUrls": [ethereum_output.all_participants[0].el_context.rpc_http_url],
        "blockExplorer": {
            "name": "blockscout",
            "apiURL": ethereum_output.blockscout_sc_verifier_url,
            "url": blockscout_url
        },
        "testnet": True,
        "chainSelector": existing_network["chainSelector"],
        "linkContract": existing_network["linkContract"],
        "routerAddress": existing_network["routerAddress"],
        "logoURL": "https://d2f70xi62kby8n.cloudfront.net/bridge/icons/networks/ethereum.svg?auto=compress%2Cformat",
        "forked-from": existing_network["key"]
    }
    return network_fork