def run(plan, args):
    env = args.get("env", "main")
    
    ethereum = import_module("github.com/LZeroAnalytics/ethereum-package@{}/main.star".format(env))
    graph = import_module("github.com/LZeroAnalytics/graph-package@{}/main.star".format(env))


    network_results = []
    forked_networks = []
    for existing_network in args.get("existing_networks", []):
        forked_network = existing_network["forked_network"]

        if not forked_network:
            ethereum_args = args.get("ethereum_args", {})
            ethereum_args["network_params"]["network_id"] = str(existing_network["id"])
            ethereum_args["participants"][0]["el_extra_env_vars"]["FORKING_RPC_URL"] = existing_network["fork_url"]

            plan.print("Spinning up Ethereum network")
            ethereum_args["env"] = env
            ethereum_output = ethereum.run(plan, ethereum_args)
            first = ethereum_output.all_participants[0]
            network_results.append(ethereum_output)
            forked_network = create_forked_network_object(ethereum_output, existing_network, ethereum_args)

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
            name="firehose-config-"+forked_network["key"].lower()
        )

        plan.print("Starting firehose container")
        firehose_service = plan.add_service(
            name="firehose-"+forked_network["key"].lower(),
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

        plan.print("Starting substream container")
        firehose_grpc_url = "{}:9000".format(firehose_service.ip_address)
        
        substream_service = plan.add_service(
            name="substream-"+forked_network["key"].lower(),
            config=ServiceConfig(
                image="tiljordan/substreams:1.0.0",
                cmd=[
                    "/bin/sh", "-c", "cd /app && substreams run map_transactions -e {} --plaintext".format(firehose_grpc_url)
                ],
            )
        )
    
    rpc_urls = {}
    for forked_network in forked_networks:
        rpc_urls[forked_network["key"]] = forked_network["rpcUrls"][0]

    plan.print("Spinning up Graph package")
    ethereum_args = args.get("ethereum_args", {})
    network_type = args.get("network_type", "bloctopus")
    graph_services = graph.run(plan, ethereum_args, network_type=network_type, env=env) 

    plan.print("Deploying subgraph with substream data source")
    
    # Get graph-node endpoint from graph services
    graph_node_url = "http://{}:8000".format(graph_services.graph.ip_address)
    
    # Add indexer service for subgraph deployment
    indexer_service = plan.add_service(
        name="indexer",
        config=ServiceConfig(
            image="tiljordan/cctup-indexer:1.0.0",
            env_vars={
                "GRAPH_NODE_URL": graph_node_url,
                "IPFS_URL": "http://{}:5001".format(graph_services.ipfs.ip_address)
            }
        )
    )
    
    # Deploy subgraph to graph node
    plan.print("Creating subgraph in graph node: {}".format(graph_node_url))
    plan.exec(
        service_name="indexer",
        recipe=ExecRecipe(
            command=["sh", "-c", "cd /app/subgraph && npm run create-local -- --node {} cctup/indexer".format(graph_node_url.replace("8000", "8020"))]
        )
    )
    
    plan.print("Deploying subgraph to graph node: {}".format(graph_node_url))
    plan.exec(
        service_name="indexer", 
        recipe=ExecRecipe(
            command=["sh", "-c", "cd /app/subgraph && npm run deploy-local -- --node {} --ipfs http://{}:5001 cctup/indexer".format(graph_node_url.replace("8000", "8020"), graph_services.ipfs.ip_address)]
        )
    )
    
    
    plan.print("Spinning up CCTUP UI")
    tomls_art = plan.render_templates(
        name   = "network-configs",
        config = {
            "/generated-network-config.yaml": struct(
                template = read_file("cctup-networks-configs-template.yaml"),
                data = {
                    "ForkedNetworks": forked_networks,
                    "ExistingNetworks": args.get("existing_networks", [])
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
        ethereum_rpc=rpc_urls,
        graph_services=graph_services,
        firehose=firehose_service,
        substream=substream_service,
        graph_endpoint=graph_node_url,
        indexer=indexer_service
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
            "url": "", #TODO need to find a way to get blocksout ui url as the name of the serivice is the same accross packages (how, doe it not conflicts?) and there is not info returnred in eth pakage output: maybe add to that?
        },
        "testnet": True,
        "chainSelector": existing_network["chainSelector"],
        "linkContract": existing_network["linkContract"],
        "routerAddress": existing_network["routerAddress"],
        "logoURL": "https://d2f70xi62kby8n.cloudfront.net/bridge/icons/networks/ethereum.svg?auto=compress%2Cformat",
        "forked-from": existing_network["key"]
    }
    return network_fork
