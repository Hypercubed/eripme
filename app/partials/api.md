# Epsilon-Prime API Help

## $bot properties
* `name`     -- name
* `x`, `y`   -- x and y positions
* `E`, `mE`  -- current and maximum energy capacity
* `S`, `mS`  -- current and maximum storage capacity
* `mem`      -- persistent bot memory storage

## $bot methods

### unload({string="@"})
Attempts to unload storage to another bot.  Unloading is only successful if the units are located in the same space. If a string is provided the bot will attempt to unload to another bot with the matching name, otherwise "@" (a "heavy" bot) is assumed.  If unloading is not possible this method has no effect.

Example:
```
$bot.unload(); 		  // Tries to unload to a heavy unit
$bot.unload('Bob'); // Tries to unload to a bot named 'Bob.
```

### charge({string="@"})
Attempts to charge batteries from another bot.  Charging is only successful if the units are located in the same space. If a string is provided will attempt to unload to a bot with the matching name.  Otherwise "@" (a "heavy" bot) is assumed.  If charging is not possible this method has no effect.

Example:
```
$bot.charge(); 		  // Tries to charge from the heavy unit
$bot.charge('Bob'); // Tries to charge from a bot named 'Bob.
```

### mine()
Attempts to mine at the current location.  Returns the number of resources collected or false if no resource are available.  If mining is not possible this method has no effect.

Example:
```
$bot.mine();
```

### upgrade()
Attempts to upgrade the bot using current resources.  If upgrading is not possible this method has no effect.

Example:
```
$bot.upgrade();
```

### construct({string})
Attempts to construct a new bot using current resources.  If a string is provided the constructed bot will start with the named script, otherwise "Manual" is assumed.  If construction is not possible this method has no effect.

Example:
```
$bot.construct();
$bot.construct('Collect');
```

### find({string})
Finds the nearest bot or tile whose name or tile character matches the string.

Example:
```
$bot.find('@');    // Finds the nearest heavy bot
$bot.find('X');	   // Finds the nearest resource cache
$bot.find('Bob');  // Finds the nearest unit named "Bob"
```

### moveTo({number},{number})
Moves towards the given x,y position.  Will perform very basic obstacle avoidance.

Example:
```
$bot.moveTo($bot.x + 5,$bot.y + 5);
var bob = $bot.find('Bob');
if (bob) {
  $bot.moveTo(bob.x,bob.y);
}
```

### distanceTo({object})
Returns the distance (in steps) to the given object position.

Example:
```
var bob = $bot.find('Bob');
console.log($bot.distanceTo(bob));
```

## $map methods

### get({number},{number})
Gets the tile located at the given x,y position.

Example:
```
var tile = $map.get($bot.x + 5,$bot.y + 5);
if (tile.t === 'X') {
  $bot.moveTo(tile.x,tile.y);
}
```

## console methods

### log(...)
Prints to browser debugging console.

Example:
```
var tile = $map.get($bot.x + 5,$bot.y + 5);
console.log(tile);
```
