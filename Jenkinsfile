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

        stage('Build & Deploy to Standby') {
            steps {
                echo "Building and deploying new version to ${env.STANDBY_SERVER}..."
                bat "docker-compose up -d --no-deps --build --force-recreate ${env.STANDBY_SERVER}"
                echo "Successfully deployed to standby."
            }
        }

        stage('Flip Router to Standby') {
            steps {
                script {
                    echo "Switching live traffic from ${env.LIVE_SERVER} to ${env.STANDBY_SERVER}..."
                    
                    def nginxConfig = readFile('nginx.conf')
                    def newConfig = nginxConfig.replace("server ${env.LIVE_SERVER}:3000", "server ${env.STANDBY_SERVER}:3000")
                    writeFile(file: 'nginx.conf', text: newConfig)
                }
                
                // --- THIS IS THE FIX ---
                echo "Restarting Nginx container to pick up changes..."
                // Replaced 'sleep' and 'docker exec' with a full restart
                bat "docker-compose restart nginx"
                
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
