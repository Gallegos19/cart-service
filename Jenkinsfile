pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        EC2_USER = 'ubuntu'
        DEV_IP = '52.87.191.135'
        QA_IP  = '35.175.142.49'
        PROD_IP = '3.222.201.39'
        REMOTE_PATH = '/home/ubuntu/cart-service'
    }

    stages {
        stage('Detect Branch') {
            steps {
                script {
                    env.ACTUAL_BRANCH = env.BRANCH_NAME ?: 'master'
                    echo "🔍 Rama activa: ${env.ACTUAL_BRANCH}"
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    file(credentialsId: 'cartservice-env', variable: 'ENV_FILE'),
                    sshUserPrivateKey(credentialsId: 'ssh-key-ec2', keyFileVariable: 'SSH_KEY1'),
                    sshUserPrivateKey(credentialsId: 'ssh-key2-ec2', keyFileVariable: 'SSH_KEY2')
                ]) {
                    script {
                        def ip, pm2_name, ssh_key

                        switch(env.ACTUAL_BRANCH) {
                            case 'dev':
                                ip = DEV_IP
                                ssh_key = SSH_KEY2
                                break
                            case 'qa':
                                ip = QA_IP
                                ssh_key = SSH_KEY2
                                break
                            case 'master':
                                ip = PROD_IP
                                ssh_key = SSH_KEY1
                                break
                            default:
                                error "Branch ${env.ACTUAL_BRANCH} no está configurada para despliegue."
                        }

                        pm2_name = "${env.ACTUAL_BRANCH}-health"

                        sh """
                        echo "📂 Asegurando que el directorio remoto existe..."
                        ssh -i "${ssh_key}" -o StrictHostKeyChecking=no "${EC2_USER}@${ip}" "mkdir -p '${REMOTE_PATH}'"

                        echo "Subiendo archivo de entorno a ${EC2_USER}@${ip}:${REMOTE_PATH}/.env.temp"
                        scp -i "${ssh_key}" -o StrictHostKeyChecking=no "${ENV_FILE}" "${EC2_USER}@${ip}:${REMOTE_PATH}/.env.temp"

                        ssh -i "${ssh_key}" -o StrictHostKeyChecking=no "${EC2_USER}@${ip}" '
                            echo "🔧 Ajustando permisos en carpeta de la app..."
                            sudo chown -R ubuntu:ubuntu ${REMOTE_PATH}
                            sudo chmod -R u+rwX ${REMOTE_PATH}

                            echo "📦 Actualizando sistema..."
                            sudo apt-get update -y

                            echo "📥 Verificando Node.js..."
                            if ! command -v node > /dev/null; then
                                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                                sudo apt-get install -y nodejs
                            fi

                            echo "📥 Verificando PM2..."
                            if ! command -v pm2 > /dev/null; then
                                sudo npm install -g pm2
                            fi

                            echo "📁 Preparando carpeta de app..."
                            if [ -d "${REMOTE_PATH}" ]; then
                                echo "🗑️ Eliminando carpeta existente..."
                                rm -rf ${REMOTE_PATH}
                            fi

                            echo "📥 Clonando repositorio..."
                            git clone -b ${env.ACTUAL_BRANCH} https://github.com/Gallegos19/cart-service.git ${REMOTE_PATH}

                            echo "📋 Actualizando .env..."
                            cp ${REMOTE_PATH}/.env.temp ${REMOTE_PATH}/.env && rm ${REMOTE_PATH}/.env.temp

                            echo "🔁 Instalando dependencias..."
                            cd ${REMOTE_PATH}
                            
                            # Verificar si existe package-lock.json, si no, usar npm install
                            if [ -f "package-lock.json" ]; then
                                echo "📦 Usando npm ci (package-lock.json encontrado)"
                                npm ci
                            else
                                echo "📦 Usando npm install (package-lock.json no encontrado)"
                                npm install
                            fi

                            echo "🛑 Verificando si pm2 tiene proceso activo..."
                            if pm2 list | grep -q ${pm2_name}; then
                                echo "🛑 Deteniendo proceso pm2 ${pm2_name}..."
                                pm2 stop ${pm2_name}
                                pm2 delete ${pm2_name}
                            else
                                echo "ℹ️ Proceso pm2 ${pm2_name} no estaba corriendo."
                            fi

                            echo "▶️ Iniciando pm2 ${pm2_name}..."
                            pm2 start src/server.js --name ${pm2_name}

                            echo "✅ Deploy completado."
                        '
                        """
                    }
                }
            }
        }
    }
}