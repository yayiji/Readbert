#!/bin/bash

# Script to rename Dilbert comic files to simple date format
# From: YYYY-MM-DD_tags.gif
# To:   YYYY-MM-DD.gif

echo "Starting Dilbert comic file renaming..."

# Navigate to the dilbert-comics directory
cd "/Users/yayiji/Me/Projects/VS-Dilbert/static/dilbert-comics"

# Counter for tracking progress
total_files=0
renamed_files=0

# Loop through each year directory
for year_dir in */; do
    if [ -d "$year_dir" ]; then
        echo "Processing year: $year_dir"
        
        # Loop through files in the year directory
        for file in "$year_dir"*.gif; do
            if [ -f "$file" ]; then
                total_files=$((total_files + 1))
                
                # Extract the base filename without directory
                basename_file=$(basename "$file")
                
                # Extract just the date part (first 10 characters: YYYY-MM-DD)
                date_part="${basename_file:0:10}"
                
                # Create new filename with just the date
                new_filename="$year_dir$date_part.gif"
                
                # Only rename if the filename is different
                if [ "$file" != "$new_filename" ]; then
                    echo "Renaming: $basename_file -> $date_part.gif"
                    mv "$file" "$new_filename"
                    renamed_files=$((renamed_files + 1))
                else
                    echo "Skipping: $basename_file (already correct format)"
                fi
            fi
        done
    fi
done

echo ""
echo "Renaming complete!"
echo "Total files processed: $total_files"
echo "Files renamed: $renamed_files"
echo "Files already correct: $((total_files - renamed_files))"
