/* global d3:true */
/* global _F:true */

(function() {

'use strict';

angular.module('ePrime')
  .controller('MainCtrl', function ($scope, $compile, $log, $route, $window, $timeout, $modal, hotkeys, debounce, modals, siteConfig, isAt, sandBox, TILES, GAME, Chunk) {

    var main = this;

    var grid = new d3.charts.Grid()  // in System
      .on('click', function(d) {
        $scope.$apply(function() {
          GAME.bots.forEach(function(bot) {
            bot.active = (bot === d.$parent);
            if (bot.active) {
              main.bot = bot;
            }
          });
        });
      });

    main.drawWatch = function drawWatch() {  // Move to ECS system? Creates a fast hash of maps state.  Most tiles don't change. Better to use events?

      var s = ''+GAME.world.getHash();

      var ke = GAME.bots.length;  // do better, move to GAME service
      //var ws = GAME.world.size;
      for(var k = 0; k < ke; k++) {
        var bot = GAME.bots[k].bot;
        var index = Chunk.getIndex(bot);
        s += bot.t+index+(bot.$parent.active ? '!' : '');
      }

      return s;
    };

    function d3Draw() {
      $log.debug('d3 draw');

      var tiles = GAME.world.scanList();  // todo: chunk
      var bots = GAME.bots.map(_F('bot'));  // todo: fix this

      d3.select('#grid').datum([tiles,bots]).call(grid);
    }

    $scope.$watch(main.drawWatch, debounce(d3Draw)); // don't do this

  //  main.upgradeBot = function(bot) {  // TODO: delete
    //  bot.upgrade();
    //};

    // TODO: canMove, isHome, isFull

    //main.isAtHome = function(bot) {  // TODO: move to bot class? used?
    //  bot = bot || main.bot;
    //  return (bot !== main.home) && isAt(bot, main.bots[0]);
    //};

    main.canMine = function(bot) {  // TODO: move to bot class?  used?
      bot = bot || main.bot;
      return GAME.world.get(bot.x,bot.y).t === TILES.MINE;
    };

    main.toggleBot = function(bot, flag) {
      if (arguments.length < 2) {
        flag = bot.manual;
      }
      bot = bot || main.bot;
      if (flag) {
        bot.run();
      } else {
        bot.stop();
      }
    };

    main.canUnload = function(bot) {  // git rid or move these to bot-panel?
      bot = bot || main.bot;
      if (bot.S <= 0) { return false; }
      return main.game.bots.some(function(_bot) {
        return _bot.t === '@' && isAt(_bot, bot) && _bot.S < _bot.mS;
      });
    };

    main.canCharge = function(bot) {
      bot = bot || main.bot;
      if (bot.E >= bot.mE) { return false; }
      return main.game.bots.some(function(_bot) {
        return _bot.t === '@' && _bot.E > 0 && isAt(_bot, bot);
      });
    };

    main.canAction = function(bot) {  // used, move
      bot = bot.bot || main.bot.bot;
      return bot.canMine() || main.canUnload(bot) || main.canCharge(bot);
    };

    main.action = function(bot) {  // used, move
      bot = bot || main.bot;

      bot.$bot.unload();
      bot.$bot.charge();
      bot.$bot.mine();
    };

    main.run = function(code) {  // used, move?
      var ret = sandBox.run(code, main.bot.$bot);
      if (ret !== true) {
        main.bot.bot.error(ret);
      }
    };

    /* cheat */
    if (siteConfig.debug) {
      hotkeys.bindTo($scope)
        .add({
          combo: 'f',
          //description: '',
          callback: function() {
            main.cheat = true;
            GAME.bots.forEach(function(d) {
              d.bot.E = d.bot.mE;
            });
          }
        })
        .add({
          combo: 'g',
          //description: '',
          callback: function() {
            main.cheat = true;
            main.game.world.scanRange(main.bot.bot.x,main.bot.bot.y,40);
            d3Draw();
          }
        });
    }

    /* _global */
    /* hotkeys.bindTo($scope)  // esc doesn't play nice with modals
      .add({
        combo: 'esc',
        description: 'Pause game',
        callback: function() {
          main.pause();
        }
      }); */

    var d = [  // move somewhere else
      ['q','NW',-1,-1],
      ['w','N' , 0,-1],
      ['e','NE', 1,-1],
      ['a','W' ,-1, 0],
      ['d','E' , 1, 0],
      ['z','SW',-1, 1],
      ['x','S' , 0, 1],
      ['c','SE', 1, 1]
    ];

    /* bot directions */  // move somewhere else
    d.forEach(function(k) {
      hotkeys.bindTo($scope)
        .add({
          combo: k[0],
          //description: '',
          callback: function() {
            main.bot.bot.move(k[2],k[3]);
          }
        });
    });

    // Allow pause
    /* var mouseTrapEnabled = true;

    Mousetrap.stopCallback = function(event, element) {

      if (!mouseTrapEnabled) {
        return true;
      }

      // if the element has the class "mousetrap" then no need to stop
      if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
        return false;
      }

      return (element.contentEditable && element.contentEditable == 'true');
    }; */

    /* bot actions */  // move somewhere else
    hotkeys.bindTo($scope)
      //.add({
      //  combo: 'q w e a d z x c',
      //  description: 'Move bot'
      //})
      .add({
        combo: 's',
        description: 'Action (Unload/load/mine)',
        callback: function() {
          main.action();
        }
      })
      /* .add({
        combo: 'r',
        description: 'Manual/auto',
        callback: function() {
          main.bot.manual = !main.bot.manual;
        }
      }) */
      .add({
        combo: 'j k',
        description: 'Prev/next bot'
      })
      .add({
        combo: '?',
        description: 'Show / hide this help menu',
        callback: function() {
          main.help();
        }
      });

    function setup() {
      main.cheat = false;
      main.game = GAME;

      //main.home = GAME.bots[0];  // remove this??
      main.bot = GAME.bots[0];  // dont do this
      main.bots = GAME.bots;
    }

    function reset() {
      main.play(0);
      GAME.clear().then(function() {
        $window.location.reload();
      });
    }

    function pauseDialog(message,showReset) {
      var _dT = main.dT;
      main.play(0);

      hotkeys.pause();

      modals.pauseConfirm(message,showReset).result
        .then(reset, function() {
          GAME.save();
          main.play(_dT);
          hotkeys.unpause();
        });
    }

    main.reset = function() {
      pauseDialog('<h1 class="text-center">Are you sure?<h1>', true);
    };

    main.relocate = function(e) { // used, move?
      if (e.bot.canRelocate()) {  // use component
        pauseDialog('<h1 class="text-center">Congratulations<h1><h3 class="text-center">You have set off to explore another planet.</h3>', true);
      }
    };

    main.help = function() {
      var _dT = main.dT;
      main.play(0);

      hotkeys.pause();

      modals.openHelp().result
        .then(null, function() {
          main.play(_dT);
          hotkeys.unpause();
        });
    };

    main.save = function() {
      GAME.save().then(function() {
        pauseDialog('<h1 class="text-center">Game saved.<h1><h4 class="text-center">You can safely close this tab<h4>', false);
      });
    };

    main.pause = function() {
      pauseDialog('', false);
    };

    main.showScripts = function(_) {

      if (typeof _ === 'string') {  //  move to dialog?
        GAME.scripts.forEach(function(d, i) {  // improve this
          if (d.name === _) {
            _ = i;
          }
        });
      }

      var _dT = main.dT;
      main.play(0);

      function done() {
        GAME.save();
        main.play(_dT);
      }

      $modal.open({
        templateUrl: 'components/editor/editor.html',
        size: 'lg',
        backdrop: 'static',
        controller: 'EditorCtrl as editor',
        resolve: {
          initialScriptId: function() { return _; }
        }
      }).result.then(done,done);
    };

    setup();

    d3Draw();

    //var mapDisplaySize = [GAME.world.size,GAME.world.size]; // not used anymore?
    //var mapOffset = [0,0];  // TODO: focus on

    main.dT = 0;   // move all this to GAME service?

    //var timer;

    //function clearTimer() {
    //  if (angular.isDefined(timer)) {
    //    $timeout.cancel( timer );
    //  }
    //}

    main.takeTurn = function() {
      GAME.ecs.$update();
    };

    main.play = function(_dT) {
      GAME.ecs.$delay = main.dT = _dT;
      if (_dT > 0) {
        GAME.ecs.$start();
      } else {
        GAME.ecs.$stop();
      }
    };

    $scope.IntroOptions = {
      disableInteraction: false,
      showStepNumbers: false,
      steps: [
      { intro: '<h2>Welcome to Epsilon-prime</h2>In Epsilon-prime your goal is to conquer the planet of ε-prime. You do this by commanding an army of bots to explore and exploit the resources of ε-prime. You can control your bots individually using your mouse and keyboard or by writing command scripts in JavaScript. The game begins with a simple (and very inefficient) set of scripts for exploring and collecting resources. Using just these scripts you could complete the game in ~2,500 turns. But you can you do better!' },
      { element: '#left-panel', intro: 'The game map is located on the left. Use the mouse and scroll wheel (or touch screen) to pan and zoom the map. The @ mark is your starting base.', position: 'right' },
      { element: '#list', intro: 'On the right is a units lists. All your units are listed here.', position: 'left' },
      { element: '.list-group-item:nth-child(1)', intro: 'At this time you have one unit… the base. Again the base is identified by the @ symbol.', position: 'left' },
      { element: '.list-group-item:nth-child(1) .energy-bar', intro: 'The red progress bar indicates the unit’s energy storage and capacity. The base unit begins with 100 J of energy. Energy is needed to move and collected resources.', position: 'left' },
      { element: '.list-group-item:nth-child(1) .energy-cost', intro: 'Above the energy indicator you will find the units movement cost and charging rate.', position: 'left' },
      { element: '.list-group-item:nth-child(1) .energy-cost .movement-cost', intro: 'The energy of the base unit is depleted at a very high rate while moving. Notice that the base requires a full charge of 100 J to move one space.', position: 'left' },
      { element: '.list-group-item:nth-child(1) .energy-cost .recharge-rate', intro: 'The base unit recharges at just over 2 J per turn. At this rate a heavy base unit can only once space move every 44 turns.', position: 'left' },
      { element: '.list-group-item:nth-child(1) .storage-bar', intro: 'The blue progress bar indicates a units resource storage and capacity. Resources are used to upgrade units or construct new units.', position: 'left' },
      { element: '.list-group-item:nth-child(1) .construct-button', intro: 'Constructing new units costs 100 kg. Construct a new unit now using the construct indicated.', position: 'left' },
      { element: '.list-group-item:nth-child(2)', intro: 'Your new unit will appear in the list...', position: 'left' },
      { element: '#left-panel', intro: 'and on the map indicated on with an A.', position: 'right' },
      { element: '.list-group-item:nth-child(2) .energy-cost', intro: 'Notice that the movement cost and recharge rate are both lower. This unit can move one space every two turns using it\'s own power generation.', position: 'left' },
      { element: '.list-group-item:nth-child(2)', intro: 'However small units can also charge from larger units. Select the rover by clicking the A and press the action key S to charge the Rover using the Base’s energy. This is the action key.  It is also used to unload any unit storage to the base and to mine resources.', position: 'left' },
      { element: '#left-panel', intro: 'You can now begin exploring the map using the Q-C keys. Q for NW, W for North, etc. If you encounter an X on the map this is a resource cache (or mine). Collect resources from the mine using the action key (S).', position: 'right' },
      { element: '.list-group-item:nth-child(2) .energy-bar', intro: 'You will notice that the energy depletes as you move and mine. You can use all your energy to mine or return to the base periodically to unload and charge. This can be done several times until your units run out of energy.', position: 'left' },
      { element: '#play-buttons', intro: 'The only way to regain energy is to take a turn. In the upper left you will see the turn indicator. Use the <i class="fa fa-step-forward"></i> button to advance several turns and regain energy.', position: 'right' },
      { element: '.list-group-item:nth-child(1)', intro: 'Use the scripts dropdown to select a bots automatic actions each turn. Select \'Construct\' for the base…', position: 'left' },
      { element: '.list-group-item:nth-child(2)', intro: 'and \'Collect\' for the bot.', position: 'left' },
      { element: '#play-buttons', intro: 'Press play button to cycle turns and watch your bots work autonomously.', position: 'right' }
      ]
    };

    $scope.introChange = function() {
      var intro = this;

      for (var i = intro._currentStep; i < this._options.steps.length; i++) {
        var currentItem = intro._introItems[i];
        var step = intro._options.steps[i];
        if (step.element) {
          currentItem.element = document.querySelector(step.element);
          currentItem.position = step.position;
        }
      }

    };

  });

})();
