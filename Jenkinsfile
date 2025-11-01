pipeline {
    agent any

    environment {
        // We replace the 'sh' command with a Groovy script to read the file.
        // This is platform-independent.
        LIVE_ENV = {
            // Use 'script' to allow Groovy logic
            script {
                if (fileExists('live.env')) {
                    // Read the file if it exists
                    return readFile('live.env').trim()
                } else {
                    // Set default if it doesn't
                    return 'CURRENT_LIVE=blue'
                }
            }
        }() // The () executes this closure immediately
    }

    stages {
        stage('Checkout') {
            steps {
                // This 'checkout scm' is automatic when using 'Pipeline from SCM'
                echo "Checking out code..."
            }
        }

        stage('Determine Environments') {
            steps {
                script {
                    // This Groovy logic is unchanged
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
                
                // Use 'bat' for Windows
                bat "docker-compose up -d --no-deps --build ${env.STANDBY_SERVER}"
                
                echo "Successfully deployed to standby."
            }
        }

        stage('Flip Router to Standby') {
            steps {
                // This 'script' block replaces the 'sed' command.
                // It's pure Groovy and works on any OS.
                script {
                    echo "Switching live traffic from ${env.LIVE_SERVER} to ${env.STANDBY_SERVER}..."
                    
                    // Read the config file into a variable
                    def nginxConfig = readFile('nginx.conf')
                    
                    // Use Groovy's built-in replace function
                    def newConfig = nginxConfig.replace("server ${env.LIVE_SERVER}:3000", "server ${env.STANDBY_SERVER}:3000")
                    
                    // Write the modified content back to the file
                    writeFile(file: 'nginx.conf', text: newConfig)
                }
                
                // Use 'bat' for Windows
                bat "docker exec nginx nginx -s reload"
                
                echo "Traffic switched."
            }
        }

        stage('Update State') {
            steps {
                // Use 'bat' for Windows
                bat "echo CURRENT_LIVE=${env.STANDBY_SERVER} > live.env"
                
                echo "Stopping old live server: ${env.LIVE_SERVER}"
                
                // Use 'bat' for Windows
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
