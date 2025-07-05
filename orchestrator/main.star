def run(plan, args):
    env = args.get("env", "main")
    
    ethereum = import_module("github.com/LZeroAnalytics/ethereum-package@{}/main.star".format(env))
    graph = import_module("github.com/LZeroAnalytics/graph-package@{}/main.star".format(env))

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
    graph_services = graph.run(plan, ethereum_args, network_type=network_type, rpc_url=rpc_url, env=env)

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
                "grpc": PortSpec(number=9000, transport_protocol="TCP", wait=None)
            },
            files = {
                "/tmp/config/": firehose_config
            },
            entrypoint=[],
            cmd=["start", "-c", "/tmp/config/firehose.yaml", "--advertise-block-features=base", "--substreams-tier1-grpc-listen-addr", ":9000", "--substreams-tier1-block-type", "sf.ethereum.type.v2.Block", "--substreams-state-bundle-size", "10", "-vvvv"]
        )
    )

    plan.print("Starting substream container")
    firehose_grpc_url = "{}:9000".format(firehose_service.ip_address)
    
    substream_service = plan.add_service(
        name="substream",
        config=ServiceConfig(
            image="tiljordan/substreams:1.0.0",
            cmd=[
                "/bin/sh", "-c", "substreams run map_transactions -e {} --plaintext && sleep infinity".format(firehose_grpc_url)
            ],
        )
    )

    plan.print("Deploying subgraph with substream data source")
    
    # Get graph-node endpoint from graph services
    graph_node_url = "http://{}:8000".format(graph_services.graph.ip_address)
    
    plan.print("Subgraph deployment placeholder - would deploy to: {}".format(graph_node_url))
    plan.print("IPFS endpoint: http://{}:5001".format(graph_services.ipfs.ip_address))
    
    plan.print("CCTUP Orchestrator deployment complete")
    
    return struct(
        ethereum_rpc=rpc_url,
        graph_services=graph_services,
        firehose=firehose_service,
        substream=substream_service,
        graph_endpoint=graph_node_url
    )
