<div align="center">
<h1 align="center">FastTrak</h1>
<h3 align="center">
Delivery Management System: Priority Scheduling and Optimised Vehicle Routing
</h3>
<a href="https://drive.google.com/file/d/1u-8Oqo1KexVCNoLnYGA5qYBwmvZyIE6p/view?usp=sharing"><strong>Read the Technical Document</strong></a>
<br/>
<br/>
  <!-- Technologies -->
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="NextJS" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML" />
  <img src="https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>
</div>

## Background & Acknowledgements
This repository contains the code for a conceptual software system I designed and implemented as part of my final year project at the University of Liverpool. As this was an educational endeavour, the cloud database and hosting services are now paused, and a live version of the project is no longer available. 

The project is discussed, with a full demonstration of the software's capabilities, in <a href="https://www.youtube.com/watch?v=_DSCNPs5n3M"><strong><u>this video</u></strong></a>. 

My academic supervisor, Professor Prudence Wong, provided support throughout the various stages of the project.

## Project Goals
- Explore academic research regarding the Vehicle Routing Problem (VRP) and devise solutions that bridge the gap between theory and real-world route planning.
- Engineer a vehicle routing system with data input and management features, priority-based delivery scheduling, and route optimisation in last-mile delivery.
- Design an algorithm to optimise the vehicles' routes to a set of customer locations while abiding by the constraints of maximum load and time window.
- Design a priority-based data structure to prioritise urgent packages implemented with a custom priority queue.

## About The Project

My fascination with logistics planning and route optimisation began during the summer of 2023 when I discovered and researched the vehicle routing problem (VRP). I then proposed my final year project to develop my own software, bridging the gap between theory and a practical, real-world solution. The system's domain focuses on intracity logistics, with two constraints: delivery time window and vehicle capacity. 

Regarding the technical aspects, I implemented a priority queue for scheduling. This allowed 'express' level packages to be prioritised ahead of 'standard' while concurrently prioritising the oldest packages over newer ones. The optimisation used the genetic algorithm, initialised with K-means, to pre-process the data into geospatial clusters, generating efficient routes following experimental evaluation. The system outputs each route containing the order of packages for each vehicle to instruct the real-world dispatch and delivery process. The overall route optimisation process uses around 1 million generations to incrementally improve the final solution's fitness.

To develop the system, I aimed to integrate the advanced algorithms behind a user-centric GUI. Therefore, it was implemented as a web application with React and Next.js utilising TypeScript for client-side and server-side code. Next.js couples with Vercel, the deployment service, offering auto-managed infrastructure, such as serverless functions, written within the same codebase as the application code. The data was stored using a cloud-based PostgreSQL database provided by Supabase and accessed via Rest API.

I chose this stack to get up and running quickly—a single codebase written in the same language provided great utility, ensuring that interfaces and functions only needed to be written once. I used the Google Maps API to geocode print addresses to find their coordinates and calculate real-world travel times for vehicle routes. 

The project's successful realisation allowed me to develop my algorithm design, software engineering and web development skills.

## Notable Files

- /lib/db: re-usable functions for database operations
- /lib/data: test data generation programs and experimental results
- /lib/routing: route optimisation algorithms (genetic algorithm, k-means)
- /lib/scheduling: delivery scheduling algorithms (priority queue)
- /lib/utils: standard utilities
