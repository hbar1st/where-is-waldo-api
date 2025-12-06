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

Routes supported by this api:

GET /                      gives a short description

GET /scene                 returns a scene url and id

GET /scene/:id/characters  returns a list of character names, and their images

GET /resumeGame            returns true if the user has an active game session that can be resumed (usually with a call to GET /game next)

GET /game                  if the user's session cookie contains a valid game id, this returns a list of remaining characters and the location of the ones that were successfully found plus the game start time (as well as the current scene id and url). It also gives the current game id which can be used to see if the user is in the top ten list (matched on the game id)

If the user doesn't have a valid game id in a session cookie, then they will get a brand new game
This is the main route that a client app would use to start a game as this route returns everything you need to get started (or complete an ongoing game)


GET /scene/:id/topten      returns the top ten players and their game times for the scene being played plus the current game id is returned to help the client find the current user in the list.

PUT /game/answer?x=X&y=Y&character="Waldo"    (x is normalized percentage value from the left, and y is normalized percentage value from the top. Both are of no more than 2 decimal precison. The origin is top left. Correct answers are accurate to a degree of 0.01 from the correct value.) The character name is one of the values returned from GET /scene/:id/characters

If the answer is correct, and there are no more characters to be found, the game ends and an elapsed time is calculated. If the elapsed time is in the top ten scores, the user's score can be saved.
(if the same game is to be replayed, the client should delete the cookie before sending a new GET /game request to restart the game)

POST /game  The client should call this if the user agrees to provide a name (the name is only recorded if the score is in the top ten list)