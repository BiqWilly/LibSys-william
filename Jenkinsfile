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
                bat 'npm install'

                // installing playwright browsers for Jenkins
                echo 'Step 3: Installing Playwright Browsers...'
                bat 'npx playwright install'
        
                // testing backend/api
                echo 'Step 4: Running Automated Unit Tests'
                bat 'npx jest test'

                // testing frontend/e2e
                echo 'Step 5: Running Automated E2E Tests (Frontend)...'
                bat 'npm run test-frontend'
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