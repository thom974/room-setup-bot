![image](https://github.com/thom974/room-setup-bot/assets/74675902/d25a8047-4237-477a-a343-5a98a1e41ee8)

# Welcome to Room Setup Bot!

This is an in-progress Discord game allowing users to create and design their own virtual 3D room. Collect money by working a job and finishing tasks and purchase furnishings on the live global market!
Users can customize their furnishings (e.g add/remove furnishings, change colours, rotate, etc.) to personalize their room. When users wish to see their room, it is 3D rendered in real-time and sent as an image to the user.

## Technology

Technology-wise, the Discord bot application was written in **Node.js** with **JavaScript** and a separate RESTful API was created to generate image creation/rendering using **Express.js** and **Three.js**. All models used are self-made in Blender, and the 3D environment seen above was created within **Three.js**. A complex database was constructed with **PostgreSQL** to store personal user data (jobs, income, tasks), available furniture (furnishings were assigned to users through related tables) and a live marketplace.

