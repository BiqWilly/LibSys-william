pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Step 1: Packaging LibSys into a Docker Image...'
                bat 'docker build -t libsys-app .'
            }
        }

        stage('Test') {
            steps {
                echo 'Step 2: Installing Dependencies...'
                // This ensures Jest and Playwright are available in the workspace
                bat 'npm install'
                
                echo 'Step 3: Running Automated Unit Tests (Jest)...'
                bat 'npm test'
            }
        }
    }

    post {
        success {
            echo 'LibSys Build and Test Phases Successful!'
        }
        failure {
            echo 'Pipeline failed. Check Console Output for errors.'
        }
    }
}