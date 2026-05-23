# CampConnect Frontend Kubernetes Manifests

`frontend.yaml` creates:

- `campconnect` namespace
- `campconnect-frontend` internal service
- `campconnect-frontend-nodeport` local/demo service on node port `30080`
- `campconnect-frontend` deployment using `ihebboughanmi/campconnect-frontend:latest`

Apply locally:

```powershell
kubectl apply -f devops/k8s/frontend.yaml
kubectl -n campconnect get pods,svc
```

For a local test through NodePort:

```text
http://localhost:30080
```

On some Docker Desktop/WSL setups, NodePort may not bind directly to Windows `localhost`. In that case, keep the same demo port by running:

```powershell
kubectl -n campconnect port-forward svc/campconnect-frontend 30080:80
```

The current Angular code still has several `http://localhost:8082` backend calls. Until those are moved behind a clean API base URL or Ingress route, keep the backend reachable on `localhost:8082` during testing. The backend Kubernetes layer provides a Docker Desktop `LoadBalancer` service for this. If that service is not available on your machine, use:

```powershell
kubectl -n campconnect port-forward svc/campconnect-backend 8082:8082
```

The target Ingress architecture is:

```text
http://campconnect.local/    -> frontend
http://campconnect.local/api -> backend
```

The Jenkins pipeline updates the frontend deployment image to the exact commit tag when Kubernetes deployment is enabled.
