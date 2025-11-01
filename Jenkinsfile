pipeline {
    agent any

    environment {
        // Read the state file. Defaults to 'blue' if file doesn't exist
        LIVE_ENV = sh(script: 'cat live.env || echo CURRENT_LIVE=blue', returnStdout: true).trim()
    }

    stages {
        stage('Checkout') {
            steps {
                // Get the latest code from your Git repo
                // For this example, we assume code is already present
                echo "Checking out code..."
                // In a real setup: git 'https://github.com/your/repo.git'
            }
        }

        stage('Determine Environments') {
            steps {
                script {
                    // Read the CURRENT_LIVE variable from the 'live.env' file
                    def live = env.LIVE_ENV.split('=')[1]

                    if (live == 'blue') {
                        env.LIVE_SERVER = 'blue'
                        env.STANDBY_SERVER = 'green'
                    } else {
                        env.LIVE_SERVER = 'green'
                        env.STANDBY_SERVER = 'blue'
                    }
                    echo "Live server is: ${env.LIVE_SERVER}"
                    echo "Standby server is: ${env.STANDBY_SERVER}"
                }
            }
        }

        stage('Build & Deploy to Standby') {
            steps {
                echo "Building and deploying new version to ${env.STANDBY_SERVER}..."
                // This command rebuilds the image and starts ONLY the standby server
                sh "docker-compose up -d --no-deps --build ${env.STANDBY_SERVER}"
                echo "Successfully deployed to standby."
                // In a real pipeline, you would add automated tests here
                // against the standby server before continuing.
            }
        }

        stage('Flip Router to Standby') {
            steps {
                echo "Switching live traffic from ${env.LIVE_SERVER} to ${env.STANDBY_SERVER}..."
                
                // Use 'sed' to edit the nginx.conf file.
                // This replaces the old live server with the new standby server.
                sh "sed -i 's/server ${env.LIVE_SERVER}:3000/server ${env.STANDBY_SERVER}:3000/g' nginx.conf"
                
                // Tell the Nginx container to reload its configuration
                sh "docker exec nginx nginx -s reload"
                
                echo "Traffic switched."
            }
        }

        stage('Update State') {
            steps {
                // Update the state file for the *next* build
                echo "Updating state file. New live server is ${env.STANDBY_SERVER}"
                sh "echo CURRENT_LIVE=${env.STANDBY_SERVER} > live.env"
                
                // We can now safely stop the old environment
                echo "Stopping old live server: ${env.LIVE_SERVER}"
                sh "docker-compose stop ${env.LIVE_SERVER}"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
    }
}