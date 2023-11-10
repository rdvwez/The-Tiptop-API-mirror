// .mocharc.js
module.exports = {
    require: 'dotenv/config', // Pour charger les variables d'environnement avec dotenv
    recursive: true,
    reporter: 'spec',
    timeout: 10000,
    exit: true,
    file: ['./test/setup.js', './test/*.test.js'], // Exécutez le script de configuration avant les tests
  };
  