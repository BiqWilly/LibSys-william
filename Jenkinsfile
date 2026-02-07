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
        
        echo 'Step 3: Running Automated Unit Tests...'
        // This forces Jest to find ANY test file in the test folder regardless of the config match
        bat 'npx jest test/william.util.test.js test/william.api.test.js'
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