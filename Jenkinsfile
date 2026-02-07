pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Step 1: Checking environment...'
                // Diagnostic check for your report
                bat 'docker --version'
                
                echo 'Step 2: Packaging LibSys into a Docker Image...'
                // This command triggers Dockerfile instructions
                bat 'docker build -t libsys-app .'
            }
        }
    }

    post {
        success {
            echo 'LibSys Build Phase Successful!'
        }
        failure {
            echo 'Build failed. Check the Dockerfile or Docker Desktop status.'
        }
    }
}