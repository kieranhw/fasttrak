# FastTrak Delivery Routing

### About

This software is designed and implemented as a project as part of my final year dissertation.

The aim of the project is to create a system to generate optimised routes for 'last mile' delivery schedules. Additionally, a modern user interface provides a platform to manage the network of delivery operations including creating and managing vehicles, packages and detailed analytical reports. Throughout the project, I have researched various academic papers on the Vehicle Routing Problem (VRP), using the insights to design a practical solution.The application is built with React and NextJS written in TypeScript, with the back end making AWS Lambda function calls to handle compute heavy data processing. Data is stored within a cloud hosted PostgreSQL database.

A schedule can be generated at any point for each day from the /dashboard/schedules page, which attempts to assign the maximum number of packages currently pending to vehicles available for the specified date. A hybrid genetic algorithm was designed to concurrently optimise the vehicle routes as well as the load utilisation for each vehicle. Regarding route optimisation, the network is modelled as a graph problem where customers are represented as nodes, connected by edges representing roads. This model allows the problem to be analysed as a typical graph problem. The Google Maps API is frequently used to calculate travel times to ensure the greatest accuracy. It is also used for geocoding tasks such as verifying customer addresses and converting street addresses into coordinates.

### Project Structure

- /lib/db: re-usable functions for database operations
- /lib/routing: files responsible for the vehicle routing optimisation such as algorithms and required classes
- /lib/scheduling: files responsible for delivery schedule generation
- /lib/utils: standard re-usable utilities
- /lib/data: test data generation used during evaluation of the project
