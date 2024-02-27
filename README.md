# FastTrak Delivery Routing

#### Author 
Kieran Hardwick
kieranhardwick260@gmail.com

### About

This software is currently under development as my final year dissertation. The aim of the project was to create a system that generates optimised routes for 'last mile' delivery schedules. The system is inspired by research into the Vehicle Routing Problem (VRP) and Travelling Salesman Problem (TSP). As the problem is NP-hard, the goal is to find a 'good enough' optimisation solution, such that computation is fast and could scale to the size of a realistic last mile service.

A modern user interface provides a platform to manage the network of delivery operations including creating and managing vehicles, packages and detailed analytical reports. The application is built with React and NextJS written in TypeScript, with the back end making AWS Lambda function calls to handle compute heavy data processing. Data is stored within a cloud hosted PostgreSQL database.

A schedule can be generated at any point for each day from the /dashboard/schedules page, which attempts to assign the maximum number of packages currently pending to vehicles available for the specified date. A hybrid genetic algorithm was designed to concurrently optimise the vehicle routes as well as the load utilisation for each vehicle. Regarding route optimisation, the network is modelled as a graph problem where customers are represented as nodes, connected by edges representing roads. This model allows the problem to be analysed as a typical graph problem. The Google Maps API is frequently used to calculate travel times to ensure the greatest accuracy. It is also used for geocoding tasks such as verifying customer addresses and converting street addresses into coordinates.

### File Structure

- /lib/db: re-usable functions for database operations
- /lib/routing: files for the route optimisation
- /lib/scheduling: files for delivery schedule generation
- /lib/utils: standard utilities
- /lib/data: test data generation used during evaluation of the project
