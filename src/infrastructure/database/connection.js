const { Pool } = require('pg');

class DatabaseConnection {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'product_db',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
      max: 20, // Máximo número de conexiones en el pool
      idleTimeoutMillis: 30000, // Cerrar conexiones inactivas después de 30s
      connectionTimeoutMillis: 2000, // Timeout para obtener conexión del pool
      
      // 🔒 Configuración SSL para AWS RDS y otros servicios cloud
      ssl: this.getSSLConfig()
    });

    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    
    // Eventos del pool
    this.pool.on('connect', (client) => {
      console.info('✅ Nueva conexión establecida con la base de datos');
    });

    this.pool.on('error', (err, client) => {
      console.error('❌ Error inesperado en cliente de BD:', err);
    });

    // Verificar conexión al inicializar
    this.testConnection();
  }

  // 🔒 Configuración SSL inteligente
  getSSLConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isAWSRDS = process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com');
    const isCloudDB = process.env.DB_HOST && (
      process.env.DB_HOST.includes('amazonaws.com') ||
      process.env.DB_HOST.includes('planetscale.com') ||
      process.env.DB_HOST.includes('digitalocean.com') ||
      process.env.DB_HOST.includes('heroku.com')
    );

    // Si está definido explícitamente en ENV
    if (process.env.DB_SSL !== undefined) {
      if (process.env.DB_SSL === 'false') {
        console.info('🔓 SSL deshabilitado por variable de entorno');
        return false;
      }
      if (process.env.DB_SSL === 'require') {
        console.info('🔒 SSL requerido por variable de entorno');
        return { rejectUnauthorized: false }; // Para desarrollo
      }
    }

    // Configuración automática basada en el host
    if (isAWSRDS) {
      console.info('🔒 AWS RDS detectado - Habilitando SSL');
      return {
        rejectUnauthorized: false, // AWS RDS usa certificados auto-firmados
        sslmode: 'require'
      };
    }

    if (isCloudDB || isProduction) {
      console.info('🔒 Base de datos en la nube detectada - Habilitando SSL');
      return {
        rejectUnauthorized: false
      };
    }

    // Local development
    if (process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1') {
      console.info('🔓 Desarrollo local detectado - SSL deshabilitado');
      return false;
    }

    // Default: intentar con SSL
    console.info('🔒 Configuración SSL automática habilitada');
    return {
      rejectUnauthorized: false
    };
  }

  async testConnection() {
    try {
      console.info('🔄 Verificando conexión a la base de datos...');
      console.info('📋 Configuración de conexión:', {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'product_db',
        user: process.env.DB_USER || 'postgres',
        port: process.env.DB_PORT || 5432,
        ssl: this.pool.options.ssl ? 'habilitado' : 'deshabilitado'
      });
      
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      
      console.info('✅ Conexión a BD exitosa:', {
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0], // Solo PostgreSQL version
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'product_db',
        ssl: this.pool.options.ssl ? '🔒 SSL habilitado' : '🔓 SSL deshabilitado'
      });
      
      client.release(); // Liberar conexión de vuelta al pool
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      return true;
    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;
      
      console.error('❌ Error conectando a la base de datos:', {
        error: error.message,
        code: error.code,
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'product_db',
        attempt: this.connectionAttempts,
        ssl: this.pool.options.ssl ? 'habilitado' : 'deshabilitado'
      });

      // Sugerencias específicas según el error
      this.provideTroubleshootingTips(error);

      // Si no es el máximo de intentos, reintentar después de un delay
      if (this.connectionAttempts < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 10000); // Backoff exponencial
        console.info(`🔄 Reintentando conexión en ${delay}ms... (${this.connectionAttempts}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.testConnection();
        }, delay);
      } else {
        console.error('💀 Máximo número de intentos de conexión alcanzado. Terminando proceso.');
        process.exit(1);
      }
      
      return false;
    }
  }

  // 💡 Sugerencias de solución según el tipo de error
  provideTroubleshootingTips(error) {
    console.log('\n💡 Sugerencias para solucionar el problema:');
    console.log('=' * 50);

    switch (error.code) {
      case '28000': // pg_hba.conf entry missing
        console.log('🔒 Error de autenticación SSL:');
        console.log('   1. Agrega DB_SSL=require a tu archivo .env');
        console.log('   2. O configura DB_SSL=false si tu BD local no usa SSL');
        console.log('   3. Para AWS RDS, SSL es obligatorio');
        console.log('\n   Ejemplo para .env:');
        console.log('   DB_SSL=require  # Para AWS RDS');
        console.log('   DB_SSL=false    # Para desarrollo local');
        break;

      case 'ENOTFOUND': // Host not found
        console.log('🌐 Host no encontrado:');
        console.log('   1. Verifica que DB_HOST esté correcto en .env');
        console.log('   2. Verifica tu conexión a internet');
        console.log('   3. El host debe ser accesible desde tu ubicación');
        break;

      case 'ECONNREFUSED': // Connection refused
        console.log('🚫 Conexión rechazada:');
        console.log('   1. Verifica que el puerto DB_PORT sea correcto');
        console.log('   2. Verifica que la BD esté corriendo');
        console.log('   3. Revisa las reglas de firewall/security groups');
        break;

      case '28P01': // Invalid password
        console.log('🔑 Contraseña incorrecta:');
        console.log('   1. Verifica DB_PASSWORD en tu archivo .env');
        console.log('   2. Verifica DB_USER en tu archivo .env');
        break;

      case '3D000': // Database does not exist
        console.log('🗃️ Base de datos no existe:');
        console.log('   1. Ejecuta: npm run init-db');
        console.log('   2. O crea la BD manualmente en tu servidor');
        break;

      default:
        console.log('🔍 Error general:');
        console.log('   1. Verifica todas las variables de entorno en .env');
        console.log('   2. Verifica conectividad de red');
        console.log('   3. Revisa los logs del servidor de BD');
    }
    console.log('=' * 50 + '\n');
  }

  async ensureConnection() {
    if (!this.isConnected) {
      console.warn('⚠️ BD no conectada, verificando conexión...');
      return await this.testConnection();
    }
    return true;
  }

  async query(text, params) {
    // Verificar conexión antes de ejecutar query
    await this.ensureConnection();
    
    const startTime = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - startTime;
      
      console.info('📊 Query ejecutado exitosamente:', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params ? params.length : 0,
        rows: result.rowCount,
        duration: `${duration}ms`
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('❌ Error en query de BD:', {
        error: error.message,
        code: error.code,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params ? params.length : 0,
        duration: `${duration}ms`
      });

      // Si es error de conexión, marcar como desconectado
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        this.isConnected = false;
        console.warn('⚠️ Conexión a BD perdida, se reintentará en próximo query');
      }
      
      throw error;
    }
  }

  async queryWithTransaction(queries) {
    await this.ensureConnection();
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      console.info('🔄 Transacción iniciada');
      
      const results = [];
      
      for (let i = 0; i < queries.length; i++) {
        const { text, params } = queries[i];
        const result = await client.query(text, params);
        results.push(result);
        
        console.info(`📊 Query ${i + 1}/${queries.length} ejecutado en transacción`);
      }
      
      await client.query('COMMIT');
      console.info('✅ Transacción confirmada exitosamente');
      
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transacción revertida debido a error:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts
    };
  }

  async close() {
    try {
      console.info('🔄 Cerrando conexiones de BD...');
      await this.pool.end();
      this.isConnected = false;
      console.info('✅ Pool de conexiones cerrado exitosamente');
    } catch (error) {
      console.error('❌ Error cerrando pool de conexiones:', error.message);
      throw error;
    }
  }

  // Método para verificar salud de la BD
  async healthCheck() {
    try {
      const start = Date.now();
      await this.ensureConnection();
      
      const result = await this.pool.query('SELECT 1 as health_check');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connections: await this.getStats(),
        ssl: this.pool.options.ssl ? 'enabled' : 'disabled',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        code: error.code,
        connections: await this.getStats(),
        ssl: this.pool.options.ssl ? 'enabled' : 'disabled',
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = DatabaseConnection;