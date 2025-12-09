# The Where's Waldo API was created for practicing full-stack development (with The Odin Project curriculum)

## Learning and/or practice goals of this practice project:
- use a TDD approach to develop the code
- separate the backend from the front-end
- maintain anonymous user sessions with cookies
- use prisma for CRUD actions against a postgresql db

## Live deployment may be at: https://where-is-waldo-api-vczk.onrender.com/

Locations of the characters (percentages from top left):

x, y

(wizard), normalized value is x=77.86 y=57.39

(waldo), normalized value is x=40.45 y=62.17

(odlaw), normalized value is x=6.87 y=68.55%

# Note: the normalized value is the x/y co-ordination value _within the scope of the scene_ divided by the *current* width or height respectively

Routes supported by this api: (Note, this api doesn't follow REST practices)

GET /                      gives a short description

GET /scene                 returns all scene ids and their image urls
GET /scene/:id             returns a specific scene image url
GET /scene/:id/game        starts a new game for this specific scene or just returns the current state of the game (game id, game answers, times, etc) if the user's session cookie contains a valid game id for the given scene, this returns a list of remaining characters and the location of the ones that were successfully found plus the game start time (as well as the current scene id and url). It also gives the current game id which can be used to see if the user is in the top ten list (matched on the game id)

If the user doesn't have a valid game id in a session cookie, then they will get a brand new game
This is the main route that a client app would use to start a game as this route returns everything you need to get started (or complete an ongoing game)

GET /scene/:id/characters  returns a list of character names, and their images

GET /scene/:id/resumeGame  returns true if the user has an active game session for this scene that can be resumed (usually with a call to GET /scene/:id/game next)

GET /scene/:id/topten      returns the top ten players and their game times for the scene being played plus the current game id and elapsed_time is returned to help the client find the current user in the list.

GET /scene/:id/game/answers       returns the list of correct answers logged so far in this game in the format of [{x,y,name}]

PUT /scene/:id/game/answer?x=X&y=Y&character="Waldo"    (x is normalized percentage value from the left, and y is normalized percentage value from the top. Both are of no more than 2 decimal precison. The origin is top left. Correct answers are accurate to a degree of less than 5.0% deviation from the correct value.) The character name is one of the values returned from GET /scene/:id/characters

If the answer is correct, and there are no more characters to be found, the game ends and an elapsed time is calculated. 
If the elapsed time is in the top ten scores, the user's score can be saved.

PUT /scene/:id/game  The client should call this if the user agrees to provide a name (the name is only recorded if the score is in the top ten list)
Note: you must not pass multi-part form data to this api. It is only read as urlencoded data.

TODO: add a way to reset and replay a game (like a DELETE /scene/:id/game followed by a GET /scene/:id/game)