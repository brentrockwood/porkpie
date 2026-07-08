#!/usr/bin/env bash
set -euo pipefail

scanner_image="aquasec/trivy:latest"
node_image="${NODE_IMAGE:-porkpie-node-dev:24-alpine}"
postgres_image="${POSTGRES_IMAGE:-cgr.dev/chainguard/postgres:latest}"

docker build -f docker/node-dev.Dockerfile -t "$node_image" .

docker run --rm -v /var/run/docker.sock:/var/run/docker.sock "$scanner_image" \
  image --scanners vuln --ignore-unfixed --severity HIGH,CRITICAL --exit-code 1 "$node_image"

docker run --rm -v /var/run/docker.sock:/var/run/docker.sock "$scanner_image" \
  image --scanners vuln --ignore-unfixed --severity HIGH,CRITICAL --exit-code 1 "$postgres_image"
