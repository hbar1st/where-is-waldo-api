# The Where's Waldo API was created for practicing full-stack development (with The Odin Project curriculum)

## Learning and/or practice goals of this practice project:
- use a TDD approach to develop the code
- separate the backend from the front-end
- maintain anonymous user sessions with cookies and passport.js
- use prisma for CRUD actions against a postgresql db


Locations of the characters:
x, y
1231, 346 (wizard)
268, 422 (waldo)
177, 417 (odlaw) 

Routes supported by this api:
GET /                      gives a short description
GET /scene                 returns a scene url and id
GET /scene/:id/characters  returns a list of character names and the enum values valid for the scene
GET /game                  if the user's session cookie contains a valid game id, this returns a list of remaining characters and the location of the ones that were successfully found plus the game start time (as well as the current scene id and url). 
If the user doesn't have a valid game id in a session cookie, then they will get a brand new game
This is the main route that a client app would use to start a game as this route returns everything you need to get started (or complete an ongoing game)


GET /scene/:id/topten      returns the top ten players and their game times for the scene being played

PUT /game/:id/answer
PUT /game/:id/username