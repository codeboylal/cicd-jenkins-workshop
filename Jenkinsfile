// Industry-standard CI/CD pipeline for the Task Tracker 3-tier app.
//
// Flow: checkout -> scan repo (Trivy, on Jenkins) -> build images
//       -> push to Docker Hub (unscanned) -> deploy to EC2 over SSH,
//       where the EC2 host pulls the images and scans them with Trivy
//       *before* bringing them up.
//
// Required Jenkins credentials (set up once via Manage Jenkins > Credentials):
//   dockerhub-creds  - "Username with password" (Docker Hub username + access token)
//   ec2-ssh-key      - "SSH Username with private key" (EC2 login user + .pem contents)
//
// Required Jenkins plugins: Docker Pipeline, Credentials Binding, SSH Credentials.
// Required on the Jenkins agent: docker, trivy.
// Required on the EC2 host: docker, docker compose plugin, trivy, and this
// repo cloned once to ~/tasktracker-cicd-lab (see WORKSHOP.md).

pipeline {
    agent any

    // No SCM trigger yet — builds are manual (or via GitHub webhook, once
    // that's wired up). See WORKSHOP.md for adding a webhook trigger later.

    parameters {
        string(name: 'EC2_HOST', defaultValue: 'ubuntu@3.209.156.211', description: 'user@host of the EC2 deploy target. Leave blank to skip deployment.')
        string(name: 'IMAGE_TAG', defaultValue: "${env.BUILD_NUMBER}", description: 'Tag applied to the built images')
    }

    environment {
        DOCKERHUB_NAMESPACE = 'lalbudha47'
        BACKEND_IMAGE        = "${DOCKERHUB_NAMESPACE}/tasktracker-backend"
        FRONTEND_IMAGE       = "${DOCKERHUB_NAMESPACE}/tasktracker-frontend"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Repo Scan - Trivy') {
            steps {
                echo 'Scanning source + dependency manifests for known vulnerabilities and secrets'
                sh '''
                    trivy fs --severity HIGH,CRITICAL --exit-code 0 \
                        --format table -o trivy-repo-report.txt .
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-repo-report.txt', allowEmptyArchive: true
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh "docker build -t ${BACKEND_IMAGE}:${params.IMAGE_TAG} ./backend"
                    }
                }
                stage('Frontend') {
                    steps {
                        sh "docker build -t ${FRONTEND_IMAGE}:${params.IMAGE_TAG} ./frontend"
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin'
                sh """
                    docker push ${BACKEND_IMAGE}:${params.IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:${params.IMAGE_TAG}

                    docker tag ${BACKEND_IMAGE}:${params.IMAGE_TAG} ${BACKEND_IMAGE}:latest
                    docker tag ${FRONTEND_IMAGE}:${params.IMAGE_TAG} ${FRONTEND_IMAGE}:latest
                    docker push ${BACKEND_IMAGE}:latest
                    docker push ${FRONTEND_IMAGE}:latest
                """
            }
        }

        stage('Deploy to EC2') {
            when {
                expression { return params.EC2_HOST?.trim() }
            }
            steps {
                echo 'Pulling images on the EC2 host and scanning them with Trivy before starting them'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'EC2_SSH_KEY')]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no -i \$EC2_SSH_KEY ${params.EC2_HOST} '
                            cd ~/tasktracker-cicd-lab &&
                            git pull &&
                            IMAGE_TAG=${params.IMAGE_TAG} docker compose -f docker-compose.prod.yml pull &&
                            trivy image --severity HIGH,CRITICAL --exit-code 0 --format table ${BACKEND_IMAGE}:${params.IMAGE_TAG} &&
                            trivy image --severity HIGH,CRITICAL --exit-code 0 --format table ${FRONTEND_IMAGE}:${params.IMAGE_TAG} &&
                            IMAGE_TAG=${params.IMAGE_TAG} docker compose -f docker-compose.prod.yml up -d &&
                            docker image prune -f
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo "Build ${params.IMAGE_TAG} pushed to Docker Hub${params.EC2_HOST?.trim() ? " and deployed to ${params.EC2_HOST}" : ''}."
        }
        failure {
            echo 'Pipeline failed - scroll up to see which stage broke and why.'
        }
    }
}
