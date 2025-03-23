#!/bin/bash

# Make sure all files are staged
git add .

# Commit changes
git commit -m "Prepare for Vercel deployment"

# Push to your repository
git push

echo "Changes pushed to the repository."
echo "To deploy to Vercel:"
echo "1. Go to https://vercel.com/import"
echo "2. Connect your GitHub repository"
echo "3. Select your repository"
echo "4. Vercel will automatically detect your configuration"
echo "5. Click 'Deploy'" 