pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    environment {
        STATIC_BRANCH = 'static'
        BUILD_OUTPUT_DIR = 'build/client'
        GIT_SSH_CREDENTIAL_ID = 'github-ssh'
        PATH = "/var/jenkins_home/.nvm/versions/node/v22.23.2/bin:${env.PATH}"
    }

    stages {
        stage('Install') {
            steps {
                sh '''
                    export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | sort -V | tail -1)/bin:$PATH"
                    bun install
                '''
            }
        }

        stage('Env') {
            steps {
                withCredentials([
                    string(credentialsId: 'revi-front-base-url', variable: 'VITE_API_BASE_URL'),
                    string(credentialsId: 'revi-front-spotify-client', variable: 'VITE_SPOTIFY_CLIENT_ID')
                ]) {
                    sh '''
                        {
                            printf "VITE_API_BASE_URL=%s\\n" "$VITE_API_BASE_URL"
                            printf "VITE_SPOTIFY_CLIENT_ID=%s\\n" "$VITE_SPOTIFY_CLIENT_ID"
                        } > .env
                    '''
                }
            }
        }

        stage('Build') {
            steps {
                sh 'bun run build'
            }
        }

        stage('Deploy static branch') {
            when {
                branch 'deploy-static'
            }
            steps {
                sshagent(credentials: [GIT_SSH_CREDENTIAL_ID]) {
                    sh '''
                        set -e

                        DEPLOY_DIR="$(mktemp -d)"
                        trap 'git worktree remove --force "$DEPLOY_DIR" 2>/dev/null || rm -rf "$DEPLOY_DIR"' EXIT

                        git fetch origin "$STATIC_BRANCH"
                        git worktree add "$DEPLOY_DIR" "origin/$STATIC_BRANCH"

                        find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
                        cp -a "$BUILD_OUTPUT_DIR/." "$DEPLOY_DIR/"

                        cd "$DEPLOY_DIR"
                        git add -A

                        if git diff --cached --quiet; then
                            echo "Build igual ao já publicado, nada para enviar."
                        else
                            git -c user.name='jenkins-deploy' -c user.email='jenkins-deploy@revi.local' \
                                commit -m "deploy: build ${BUILD_NUMBER}"
                            git push origin "HEAD:${STATIC_BRANCH}"
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'rm -f .env'
            sh 'git worktree prune || true'
        }
    }
}