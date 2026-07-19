// Industry-standard CI/CD pipeline for the Task Tracker 3-tier app.
//
// Flow: checkout -> scan repo (Trivy) -> build images -> push to Docker Hub
//       (unscanned) -> pull them back down and scan with Trivy -> deploy.
//
// Jenkins runs directly on the EC2 instance for this workshop, so "deploy"
// is just `docker compose` run in the workspace — no SSH hop to a separate
// host. (If Jenkins and the deploy target were different machines, this
// stage would need to SSH over instead — see WORKSHOP.md for that variant.)
//
// Required Jenkins credentials (set up once via Manage Jenkins > Credentials):
//   dockerhub-creds  - "Username with password" (Docker Hub username + access token)
//
// Required Jenkins plugins: Docker Pipeline, Credentials Binding.
// Required on this host: docker, docker compose plugin, trivy.

pipeline {
    agent any

    // No SCM trigger yet — builds are manual (or via GitHub webhook, once
    // that's wired up). See WORKSHOP.md for adding a webhook trigger later.

    parameters {
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

        stage('Deploy') {
            steps {
                echo 'Pulling images and scanning them with Trivy before starting them'
                sh """
                    IMAGE_TAG=${params.IMAGE_TAG} docker compose -f docker-compose.prod.yml pull
                    trivy image --severity HIGH,CRITICAL --exit-code 0 --format table ${BACKEND_IMAGE}:${params.IMAGE_TAG}
                    trivy image --severity HIGH,CRITICAL --exit-code 0 --format table ${FRONTEND_IMAGE}:${params.IMAGE_TAG}
                    IMAGE_TAG=${params.IMAGE_TAG} docker compose -f docker-compose.prod.yml up -d
                    docker image prune -f
                """
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo "Build ${params.IMAGE_TAG} pushed to Docker Hub and deployed."
        }
        failure {
            echo 'Pipeline failed - scroll up to see which stage broke and why.'
        }
    }
}
