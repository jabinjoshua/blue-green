pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code..."
            }
        }

        stage('Initialize') {
            steps {
                script {
                    echo "Determining live and standby servers..."
                    
                    def live
                    if (fileExists('live.env')) {
                        live = readFile('live.env').trim().split('=')[1]
                    } else {
                        // If no file, default to 'blue' being live
                        live = 'blue'
                    }

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

        // New stage to ensure nginx and the live server are up
        stage('Verify Initial State') {
            steps {
                echo "Ensuring nginx and ${env.LIVE_SERVER} are running..."
                // Use the project flag '-p bluegreen'
                bat "docker-compose -p bluegreen up -d --no-deps ${env.LIVE_SERVER} nginx"
            }
        }

        stage('Build & Deploy to Standby') {
            steps {
                echo "Building and deploying new version to ${env.STANDBY_SERVER}..."
                // Use the project flag '-p bluegreen'
                bat "docker-compose -p bluegreen up -d --no-deps --build --force-recreate ${env.STANDBY_SERVER}"
                echo "Successfully deployed to standby."
            }
        }

        stage('Flip Router to Standby') {
            steps {
                script {
                    echo "Switching live traffic to ${env.STANDBY_SERVER}..."
                    
                    def nginxConfig = readFile('nginx.conf')
                    
                    // --- THIS IS THE FIX ---
                    // First, replace 'blue' with the new server
                    def newConfig = nginxConfig.replace("server blue:3000", "server ${env.STANDBY_SERVER}:3000")
                    // Then, replace 'green' with the new server.
                    // This makes the replacement idempotent.
                    newConfig = newConfig.replace("server green:3000", "server ${env.STANDBY_SERVER}:3000")
                    
                    writeFile(file: 'nginx.conf', text: newConfig)
                }
                
                echo "Restarting Nginx to pick up changes..."
                bat "docker-compose -p bluegreen restart nginx"
                
                echo "Traffic switched."
            }
        }

        stage('Update State') {
            steps {
                bat "echo CURRENT_LIVE=${env.STANDBY_SERVER} > live.env"
                
                echo "Stopping old live server: ${env.LIVE_SERVER}"
                // Use the project flag '-p bluegreen'
                bat "docker-compose -p bluegreen stop ${env.LIVE_SERVER}"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
    }
}

