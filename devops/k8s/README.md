# CampConnect Frontend Kubernetes Manifests

`frontend.yaml` creates:

- `campconnect` namespace
- `campconnect-frontend` internal service
- `campconnect-frontend` deployment using `ihebboughanmi/campconnect-frontend:latest`

Apply locally:

```powershell
kubectl apply -f devops/k8s/frontend.yaml
kubectl -n campconnect get pods,svc
```

For a local test without Ingress:

```powershell
kubectl -n campconnect port-forward svc/campconnect-frontend 4200:80
```

The current Angular code still has several `http://localhost:8082` backend calls. Until those are moved behind a clean API base URL or Ingress route, also expose the backend locally when testing:

```powershell
kubectl -n campconnect port-forward svc/campconnect-backend 8082:8082
```

The Jenkins pipeline updates the frontend deployment image to the exact commit tag when Kubernetes deployment is enabled.
