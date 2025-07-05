POSTGRES_MIN_CPU = 10
POSTGRES_MAX_CPU = 1000
POSTGRES_MIN_MEMORY = 32
POSTGRES_MAX_MEMORY = 1024

def run(plan, args):
    env = args.get("env", "main")
    
    ethereum = import_module("github.com/LZeroAnalytics/ethereum-package@{}/main.star".format(env))
    postgres = import_module("github.com/tiljrd/postgres-package@{}/main.star".format(env))

    rpc_url = args.get("rpc_url")
    if not rpc_url:
        plan.print("Spinning up Ethereum network")
        ethereum_args = args.get("ethereum_args", {})
        ethereum_args["env"] = env
        ethereum_output = ethereum.run(plan, ethereum_args)
        first = ethereum_output.all_participants[0]
        rpc_url = "http://{}:{}".format(first.el_context.ip_addr, first.el_context.rpc_port_num)
    
    plan.print("Using RPC URL: {}".format(rpc_url))

    plan.print("Spinning up Graph package")
    ethereum_args = args.get("ethereum_args", {})
    network_type = args.get("network_type", "bloctopus")

    plan.print("Rendering firehose template with RPC: {}".format(rpc_url))
    firehose_config = plan.render_templates(
        config={
            "firehose.yaml": struct(
                template=read_file("templates/firehose.yaml.tmpl"),
                data={
                    "rpc_url": rpc_url
                }
            )
        },
        name="firehose-config"
    )

    plan.print("Starting firehose container")
    firehose_service = plan.add_service(
        name="firehose",
        config=ServiceConfig(
            image="tiljordan/firehose:1.0.0",
            ports={
                "grpc": PortSpec(number=9000, transport_protocol="TCP", wait="1m"),
                "api": PortSpec(number=10015, transport_protocol="TCP", wait="1m")
            },
            files = {
                "/tmp/config/": firehose_config
            },
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
            firehose_token = "",
            rpc = rpc_url,
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
                "GRAPH_NODE_FIREHOSE_DISABLE_EXTENDED_BLOCKS_FOR_CHAINS": disable_check_list
            },
            files={
                "/tmp/config/": graph_node_config
            },
            cmd=[
                "graph-node",
                "--config", "/tmp/config/config.toml",
                "--ipfs", ipfs_url,
                "--node-id", "block_ingestor_node",
            ]
        )
    )

    graph_services = struct(
        postgres = postgres_output,
        ipfs = ipfs_output,
        graph = graph_output
    )
    
    # Get graph-node endpoint from graph services
    graph_node_url = "http://{}:8000".format(graph_services.graph.ip_address)
    
    plan.print("Subgraph deployment placeholder - would deploy to: {}".format(graph_node_url))
    plan.print("IPFS endpoint: http://{}:5001".format(graph_services.ipfs.ip_address))
    
    plan.print("CCTUP Orchestrator deployment complete")
    
    return struct(
        ethereum_rpc=rpc_url,
        graph_services=graph_services,
        firehose=firehose_service,
        graph_endpoint=graph_node_url
    )
