# Docker Configuration

## How to Use

The application loads configuration from a YAML file that is served as a static asset. 

**Build Time**: Set `CCIP_CONFIG_FILE` to specify which YAML file to bundle:
```bash
docker build --build-arg CCIP_CONFIG_FILE=./my-config.yaml -t ccip-ui .
```

**Runtime**: Mount your config and set `NEXT_PUBLIC_CCIP_CONFIG_FILE`:
```bash
docker run -p 3000:3000 \
  -v $(pwd)/my-config.yaml:/app/public/custom.yaml:ro \
  -e NEXT_PUBLIC_CCIP_CONFIG_FILE=/custom.yaml \
  ccip-ui
```

## Examples

### Option 1: Build with Custom Config
```bash
# Build with your config baked in
docker build \
  --build-arg CCIP_CONFIG_FILE=./production.yaml \
  -t ccip-ui:prod .

docker run -p 3000:3000 ccip-ui:prod
```

### Option 2: Runtime Config Mount
```bash
# Build once
docker build -t ccip-ui .

# Run with different configs
docker run -p 3000:3000 \
  -v $(pwd)/staging.yaml:/app/public/config.yaml:ro \
  -e NEXT_PUBLIC_CCIP_CONFIG_FILE=/config.yaml \
  ccip-ui
```

## Docker Compose

```yaml
version: '3.8'
services:
  ccip-ui:
    image: ccip-ui:latest
    ports:
      - "3000:3000"
    volumes:
      - ./chains.yaml:/app/public/chains.yaml:ro
    environment:
      - NEXT_PUBLIC_CCIP_CONFIG_FILE=/chains.yaml
```

## Default Behavior

If not specified, the app looks for `/chains.yaml` in the public directory. 