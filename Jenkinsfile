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

        stage('Deploy to Minikube') {
            steps {
                echo 'Step 6: Orchestrating LibSys with Kubernetes...'
                
                // Deploy Libsys by applying the deployment and service YAML files 
                bat 'kubectl apply -f deployment.yaml'
                bat 'kubectl apply -f service.yaml'

                // Force a restart to ensure it uses the latest build
                bat 'kubectl rollout restart deployment/libsys-deployment'

                // to monitor the deployment and check its status
                echo 'Deployment Complete! Checking status...'
                bat 'kubectl get pods'
                bat 'kubectl get services'
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