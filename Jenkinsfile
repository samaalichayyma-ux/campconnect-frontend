def runNpm(String command) {
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
    }

    environment {
        CI = 'true'
        CHROME_BIN = '/usr/bin/chromium'
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
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true, fingerprint: true, artifacts: 'dist/**'
        }
    }
}
