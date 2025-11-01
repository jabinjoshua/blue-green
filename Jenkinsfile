pipeline {
    agent any

    // We remove the environment block, as it was causing the
    // syntax error. We will set these variables in a stage.

    stages {
        stage('Checkout') {
            steps {
                // This 'checkout scm' is automatic when using 'Pipeline from SCM'
                echo "Checking out code..."
            }
        }

        // New stage to set up our environment variables
        stage('Initialize') {
            steps {
                script {
                    echo "Determining live and standby servers..."
                    
                    def live
                    if (fileExists('live.env')) {
                        // Read the file if it exists
                        live = readFile('live.env').trim().split('=')[1]
                    } else {
                        // Set default if it doesn't
                        live = 'blue'
                    }

                    // Now set the env variables for all other stages
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

        // This stage now just uses the variables set in the 'Initialize' stage
        stage('Build & Deploy to Standby') {
            steps {
                echo "Building and deploying new version to ${env.STANDBY_SERVER}..."
                
                // Use 'bat' for Windows
                bat "docker-compose up -d --no-deps --build ${env.STANDBY_SERVER}"
                
                echo "Successfully deployed to standby."
            }
        }

        stage('Flip Router to Standby') {
            steps {
                // This script block is fine because it's inside 'steps'
                script {
                    echo "Switching live traffic from ${env.LIVE_SERVER} to ${env.STANDBY_SERVER}..."
                    
                    def nginxConfig = readFile('nginx.conf')
                    def newConfig = nginxConfig.replace("server ${env.LIVE_SERVER}:3000", "server ${env.STANDBY_SERVER}:3000")
                    writeFile(file: 'nginx.conf', text: newConfig)
                }
                
                bat "docker exec nginx nginx -s reload"
                echo "Traffic switched."
            }
        }

        stage('Update State') {
            steps {
                bat "echo CURRENT_LIVE=${env.STANDBY_SERVER} > live.env"
                
                echo "Stopping old live server: ${env.LIVE_SERVER}"
                bat "docker-compose stop ${env.LIVE_SERVER}"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
    }
}
