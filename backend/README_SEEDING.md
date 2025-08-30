# Job Seeding Instructions

## Overview
This application includes a seed script to populate the database with sample jobs tailored for the Philippines tech market.

## Running the Seed Script

### From the backend directory:
```bash
cd backend
npm run seed:jobs
```

### From the root directory:
```bash
cd backend && npm run seed:jobs
```

## What the Script Does

1. **Connects to MongoDB** using the connection string from your .env file
2. **Creates a default recruiter** if none exists (required to post jobs)
3. **Clears existing jobs** (optional - you can comment out this line if you want to keep existing jobs)
4. **Inserts 10 sample jobs** with Philippine companies and PHP salaries

## Sample Jobs Included

The seed script creates jobs from well-known Philippine tech companies:

1. **Senior Full Stack Developer** - TechStart Philippines (₱80K-120K/month)
2. **Frontend Developer (React)** - Shopee Philippines (₱55K-85K/month)
3. **Backend Developer - Python** - GCash (Globe Fintech) (₱70K-100K/month)
4. **DevOps Engineer** - Grab Philippines (₱90K-140K/month)
5. **Mobile App Developer (Flutter)** - PayMaya Philippines (₱60K-90K/month)
6. **Data Analyst** - Lazada Philippines (₱50K-75K/month)
7. **Junior Software Developer** - Accenture Philippines (₱25K-40K/month)
8. **UI/UX Designer** - Kumu Media Technologies (₱45K-70K/month)
9. **QA Engineer** - Voyager Innovations (₱50K-75K/month)
10. **Product Manager** - Coins.ph (₱100K-150K/month)

## Job Features

Each job includes:
- ✅ **Philippine locations** (Metro Manila cities)
- ✅ **PHP currency** with realistic monthly salaries
- ✅ **Relevant skills** for each role
- ✅ **Filipino work benefits** (HMO, 13th month pay, etc.)
- ✅ **Hybrid/Remote options** where appropriate
- ✅ **Multiple experience levels** (entry, mid, senior)
- ✅ **Different departments** (Engineering, Design, Product, Data Science)

## Customization

To modify the jobs or add your own:
1. Edit the `sampleJobs` array in `src/scripts/seedJobs.js`
2. Follow the same structure for consistency
3. Run the seed script again

## Environment Requirements

Make sure your `.env` file contains:
```
MONGODB_URI=mongodb://localhost:27017/resume-ai-analyzer
```

The script will use this connection string to connect to your database.

## Troubleshooting

- **Connection Error**: Ensure MongoDB is running and the connection string is correct
- **Validation Error**: Check that all required fields are included in job data
- **Duplicate Key Error**: The script handles this automatically by inserting jobs one by one

## Resetting

To completely reset and reseed:
1. The script automatically clears existing jobs
2. Run `npm run seed:jobs` again
3. Fresh data will be inserted

Now your application will have plenty of realistic Philippine tech jobs to display!
