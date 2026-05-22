# Jenkins and SonarQube

This frontend repo is intended to run as its own Jenkins Pipeline job.

## Jenkins job

Create a Pipeline job named:

```text
campconnect-frontend-ci
```

Use `Pipeline script from SCM`:

- SCM: `Git`
- Repository URL: `https://github.com/samaalichayyma-ux/campconnect-frontend.git`
- Branch: `main`
- Script Path: `Jenkinsfile`

## Jenkins requirements

The Jenkins agent needs:

- Node.js 20 or newer
- npm
- SonarScanner for Jenkins configured as `SonarScanner`
- SonarQube server configured as `SonarQube`
- Chrome or Chromium only if `RUN_FRONTEND_TESTS=true`

## SonarQube project

Create a SonarQube project:

- Project key: `campconnect-frontend`
- Project name: `CampConnect Frontend`

The pipeline reads scanner defaults from `sonar-project.properties`.
