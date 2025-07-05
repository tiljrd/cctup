use std::env;
use std::path::PathBuf;

fn main() {
    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
    
    prost_build::Config::new()
        .out_dir(&out_dir)
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile_protos(&["proto/cctup.proto"], &["proto/"])
        .unwrap();
}
