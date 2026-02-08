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
                echo 'Step 3: Installing Playwright Browsers'
                bat 'npx playwright install'
        
                // testing backend/api
                echo 'Step 4: Running Automated Unit Tests'
                bat 'npm run test'

                // testing frontend/e2e
                echo 'Step 5: Running Automated E2E Tests (Frontend'
                bat 'set CI=true && npm run test-frontend' // 'set CI=true' to tell Playwright it is running in Jenkins
            }
        }

        stage('Deploy') {
            steps {
            echo 'Step 6: Deploying LibSys to Local Environment...'

                // Stop container if it exists (ignore failure)
                bat 'docker stop libsys-container || exit /b 0'

                // Remove container if it exists (ignore failure)
                bat 'docker rm libsys-container || exit /b 0'

                // Run new container
                bat 'docker run -d --name libsys-container -p 5050:5050 libsys-app'

                echo 'Deployment Complete! Access at http://localhost:5050'
            }
        }
    }

    post {
        success {
            echo 'LibSys Build and Test Phases Successful!'
            mail to: 'hatinhuy@gmail.com',
                 subject: "SUCCESS: LibSys Build #${env.BUILD_NUMBER}",
                 body: """Congratulations! The LibSys pipeline has completed successfully.
                          
Build Number: ${env.BUILD_NUMBER}
Commit: ${env.GIT_COMMIT}
Status: SUCCESS

access the live application at http://localhost:5050
Check Jenkins logs here: ${env.BUILD_URL}"""
        }
        failure {
            echo 'Pipeline failed. Check Console Output for errors.'
            mail to: 'hatinhuy@gmail.com',
                 subject: "FAILURE: LibSys Build #${env.BUILD_NUMBER}",
                 body: """Attention: The LibSys pipeline has failed at a specific stage.
                          
Build Number: ${env.BUILD_NUMBER}
Status: FAILED

Please review the console output immediately to identify the issue:
${env.BUILD_URL}console"""
        }
    }
}