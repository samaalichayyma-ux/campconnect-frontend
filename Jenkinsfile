def runNpm(String command) {
    if (isUnix()) {
        sh command
    } else {
        bat command
    }
}

def runCommand(String command) {
    if (isUnix()) {
        sh command
    } else {
        bat command
    }
}

def runSonarScanner(String scannerHome) {
    if (isUnix()) {
        sh "${scannerHome}/bin/sonar-scanner"
    } else {
        bat "\"${scannerHome}\\bin\\sonar-scanner.bat\""
    }
}

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'SONARQUBE_SERVER', defaultValue: 'SonarQube', description: 'Jenkins SonarQube server name.')
        string(name: 'SONAR_SCANNER_TOOL', defaultValue: 'SonarScanner', description: 'Jenkins SonarScanner tool name.')
        booleanParam(name: 'RUN_SONAR', defaultValue: true, description: 'Run SonarQube analysis.')
        booleanParam(name: 'RUN_FRONTEND_TESTS', defaultValue: false, description: 'Run Angular tests. Requires Chrome/Chromium on the Jenkins agent.')
        booleanParam(name: 'ENFORCE_QUALITY_GATE', defaultValue: true, description: 'Fail the pipeline when the SonarQube quality gate fails.')
        booleanParam(name: 'BUILD_DOCKER_IMAGE', defaultValue: true, description: 'Build the frontend Docker image.')
        booleanParam(name: 'PUSH_DOCKER_IMAGE', defaultValue: true, description: 'Push the frontend Docker image to Docker Hub.')
        string(name: 'DOCKERHUB_NAMESPACE', defaultValue: 'ihebboughanmi', description: 'Docker Hub namespace or username.')
        string(name: 'DOCKERHUB_CREDENTIALS_ID', defaultValue: 'dockerhub-credentials', description: 'Jenkins Docker Hub credentials ID.')
    }

    environment {
        CI = 'true'
        CHROME_BIN = '/usr/bin/chromium'
        DOCKER_IMAGE_NAME = 'campconnect-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    runNpm('npm ci')
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    runNpm('npm run build -- --configuration production')
                }
            }
        }

        stage('Test') {
            when {
                expression { params.RUN_FRONTEND_TESTS }
            }
            steps {
                script {
                    runNpm('npm test -- --watch=false --browsers=ChromeHeadless --code-coverage')
                }
            }
            post {
                always {
                    archiveArtifacts allowEmptyArchive: true, artifacts: 'coverage/**'
                }
            }
        }

        stage('SonarQube Analysis') {
            when {
                expression { params.RUN_SONAR }
            }
            steps {
                withSonarQubeEnv(params.SONARQUBE_SERVER) {
                    script {
                        def scannerHome = tool params.SONAR_SCANNER_TOOL
                        runSonarScanner(scannerHome)
                    }
                }
            }
        }

        stage('Quality Gate') {
            when {
                expression { params.RUN_SONAR && params.ENFORCE_QUALITY_GATE }
            }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            when {
                expression { params.BUILD_DOCKER_IMAGE }
            }
            steps {
                script {
                    def tag = env.GIT_COMMIT ? env.GIT_COMMIT.take(12) : "build-${env.BUILD_NUMBER}"
                    env.DOCKER_IMAGE_TAG = tag
                    env.DOCKER_IMAGE_REPO = "${params.DOCKERHUB_NAMESPACE}/${env.DOCKER_IMAGE_NAME}"

                    runCommand("docker build --pull -t ${env.DOCKER_IMAGE_REPO}:${env.DOCKER_IMAGE_TAG} -t ${env.DOCKER_IMAGE_REPO}:latest .")
                }
            }
        }

        stage('Docker Push') {
            when {
                expression { params.BUILD_DOCKER_IMAGE && params.PUSH_DOCKER_IMAGE }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: params.DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_TOKEN')]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                set +x
                                echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
                                set -x
                                docker push "$DOCKER_IMAGE_REPO:$DOCKER_IMAGE_TAG"
                                docker push "$DOCKER_IMAGE_REPO:latest"
                                docker logout
                            '''
                        } else {
                            bat '''
                                @echo off
                                echo %DOCKERHUB_TOKEN% | docker login -u %DOCKERHUB_USERNAME% --password-stdin
                                docker push %DOCKER_IMAGE_REPO%:%DOCKER_IMAGE_TAG%
                                docker push %DOCKER_IMAGE_REPO%:latest
                                docker logout
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true, fingerprint: true, artifacts: 'dist/**'
        }
    }
}
