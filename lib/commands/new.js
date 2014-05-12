var async   = require('async');
var path    = require('path');
var chalk   = require('chalk');
var Config  = require('../utils/config');
var Command = require('../models/command');

var NewCommand = Command.extend({
  name: 'new',
  usage: [
      chalk.white('\toptions: '),
      chalk.white('\t\trequired\t --name / -n\t\t NameOfApp'),
      chalk.white('\t\trequired\t --id / -i\t\t com.reverse.style.domain'),
      chalk.white('\t\toptional\t --directory / -d\t myproject')
  ],
  parseOptions: function() {
    this.options.name    = this.options.name      || this.options.n;
    this.options.id      = this.options.id        || this.options.i;
    this.options.dirName = this.options.directory || this.options.d || 'app';
  },
  validateOptions: function() {
    if(this.options.name && this.options.id) {
      return true;
    }
  },
  run: function() {
    var projectPath = path.join(process.cwd(), this.options.dirName);
    var configPath  = path.join(projectPath, '.ember-cdv');

    var config = new Config(configPath, {
      projectPath:  path.join(process.cwd(), this.options.dirName),
      name:         this.options.name,
      id:           this.options.id
    });

    var tasks = [
      require('../tasks/create-cordova-project')(config),
      require('../tasks/copy-hooks')(config),
      require('../tasks/add-platforms')(config),

      require('../tasks/create-ember-project')(config),
      require('../tasks/install-bower-dependencies')(config),
      require('../tasks/install-npm-dependencies')(config),
      require('../tasks/copy-ember-cli-modules')('initializers', config)
    ];

    async.series(tasks,
      function(err) {
        if(err) throw err;

        // only needed for setup. for all later commands we initialize a project
        // which already has the project root
        config.delete('projectPath');
        config.flush(); // write config

        require('./link-production')({projectPath: projectPath});

        console.log('');
        console.log('');
        console.log(chalk.cyan('-------------------'));
        console.log(chalk.green('All Done. Enjoy :)'));
        console.log(chalk.cyan('-------------------'));
      }
    );
  }
})

module.exports = function(options) {
  return new NewCommand(options)
}