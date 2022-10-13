# Ukraine Report - Alpha-One

Welcome to alpha-one. This release provides a buggy but workable version of my mapping application I use to report over the situation in Ukraine. It still requires clean-up of code and allot of features needs to be added.

Yes, I know the code is a disaster, I’m planning to clean it up -_-

To run it. Install Docker and run the container from inside the root folder of the project.

```docker run -d -p 80:80 -v $(pwd)/Map:/usr/share/nginx/html nginx```

## Tools

**Snapping:** If "ON", the closest existing polygon will be chosen
![alt](Media/Snapping.webp)