def run(plan, args):
    # TODO: Spin up Ethereum network if rpc not provided in args
    # TODO: Spin up Graph package
    # TODO: Render firehose template with rpc
    # TODO: Run firehose container with firehose template (cmd is firecore start -c /tmp/config/firehose.yaml --advertise-block-features=base and add --substreams-tier1-grpc-listen-addr and )
    # TODO: Run substream in container and connect to firehose grpc
    # TODO: Create and deploy subgraph and read the substream data source correctly
    plan.print("CCTUP Orchestrator")