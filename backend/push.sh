set -euo pipefail

IMAGE="ghcr.io/constantine950/ranshe"
TAG="${1:-latest}"

docker build -t "${IMAGE}:${TAG}" -f ../docker/Dockerfile.backend .
docker push "${IMAGE}:${TAG}"

echo "Pushed ${IMAGE}:${TAG}"