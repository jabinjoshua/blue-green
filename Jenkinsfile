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

        // ... (previous stages are the same) ...

        stage('Flip Router to Standby') {
            steps {
                script {
                    echo "Switching live traffic to ${env.STANDBY_SERVER}..."
                    
                    def nginxConfig = readFile('nginx.conf')
                    
                    // Idempotent replacement logic
                    def newConfig = nginxConfig.replace("server blue:3000", "server ${env.STANDBY_SERVER}:3000")
                    newConfig = newConfig.replace("server green:3000", "server ${env.STANDBY_SERVER}:3000")
                    
                    // --- NEW LOGGING ---
                    echo "New nginx.conf content will be:"
                    echo newConfig
                    // --- END NEW LOGGING ---

                    writeFile(file: 'nginx.conf', text: newConfig)
                }
                
                echo "Restarting Nginx to pick up changes..."
                bat "docker-compose -p bluegreen restart nginx"
                
                echo "Traffic switched."
            }
        }

        stage('Update State') {
            steps {
                // --- THIS IS THE FIX ---
                // Replaced 'bat "echo..."' with the more reliable 'writeFile'
                script {
                    def newState = "CURRENT_LIVE=${env.STANDBY_SERVER}"
                    echo "Updating state file to: ${newState}"
                    writeFile(file: 'live.env', text: newState)
                }
                
                echo "Stopping old live server: ${env.LIVE_SERVER}"
                bat "docker-compose -p bluegreen stop ${env.LIVE_SERVER}"
            }
        }
// ... (rest of the file is the same) ...
    }

    post {
        always {
            echo "Pipeline finished."
        }
    }
}


