pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    environment {
        STATIC_BRANCH = 'static'
        BUILD_OUTPUT_DIR = 'build/client'
        GIT_SSH_CREDENTIAL_ID = 'github-revi-front-static-ssh'
        GIT_REPO_SSH_URL = 'git@github.com:MansourPixels/website-react.git'
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
                    string(credentialsId: 'revi-front-base-url', variable: 'VITE_API_BASE_URL')
                ]) {
                    sh '''
                        {
                            printf "VITE_API_BASE_URL=%s\\n" "$VITE_API_BASE_URL"
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
                withCredentials([sshUserPrivateKey(credentialsId: GIT_SSH_CREDENTIAL_ID, keyFileVariable: 'SSH_KEY_FILE')]) {
                    sh '''
                        set -e

                        export GIT_SSH_COMMAND="ssh -i $SSH_KEY_FILE -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

                        DEPLOY_DIR="$(mktemp -d)"
                        trap 'git worktree remove --force "$DEPLOY_DIR" 2>/dev/null || rm -rf "$DEPLOY_DIR"' EXIT

                        git fetch "$GIT_REPO_SSH_URL" "$STATIC_BRANCH"
                        git worktree add --detach "$DEPLOY_DIR" FETCH_HEAD

                        find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
                        cp -a "$BUILD_OUTPUT_DIR/." "$DEPLOY_DIR/"

                        cd "$DEPLOY_DIR"
                        git add -A

                        if git diff --cached --quiet; then
                            echo "Build igual ao já publicado, nada para enviar."
                        else
                            git -c user.name='Henrique-CBueno' -c user.email='henriquecb2507@outlook.pt' \
                                commit -m "deploy: build ${BUILD_NUMBER}"
                            git push "$GIT_REPO_SSH_URL" "HEAD:${STATIC_BRANCH}"
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