# # 1. Define the specific list of files you want to merge.
# #    You must include the correct path from where you run the script.
# specific_files_to_merge = [
#     'backend/main.py',
#     'backend/crud.py',
#     'frontend/src/App.jsx',
# ]

# # 2. Choose a name for the final, combined file.
# output_filename = 'merged_specific_files.txt'

# # 3. This part opens the output file and writes the content from your list.
# try:
#     with open(output_filename, 'w', encoding='utf-8') as outfile:
#         print(f"Processing {len(specific_files_to_merge)} files...")

#         for filename in specific_files_to_merge:
#             # Add a clear header to identify the content of each file.
#             outfile.write(f'# {"-"*15} START OF FILE: {filename} {"-"*15}\n\n')
#             try:
#                 # Open and read each file from the list.
#                 with open(filename, 'r', encoding='utf-8') as infile:
#                     outfile.write(infile.read())
#                 outfile.write(f'\n\n# {"-"*15} END OF FILE: {filename} {"-"*15}\n\n')
#             except FileNotFoundError:
#                 print(f"⚠️  Warning: File not found at '{filename}'. It will be skipped.")
#                 outfile.write(f'# !!! ERROR: File not found at path: {filename} !!!\n\n')
#             except Exception as e:
#                 print(f"❌ Error reading '{filename}': {e}")
#                 outfile.write(f'# !!! Could not read file {filename}: {e} !!!\n\n')

#     print(f"✅ Success! Merged the specified files into '{output_filename}'.")

# except Exception as e:
#     print(f"❌ An error occurred while writing the output file: {e}")














import sys
import pyperclip

# --- Configuration ---

# 1. Define the specific list of files you want to merge.
#    You must include the correct path from where you run the script.
specific_files_to_merge = [
    'backend/main.py',
    'backend/crud.py',
    'backend/schemas.py',
    'backend/models.py',
    'backend/database.py',
    'backend/auth.py',
    'frontend/src/App.jsx',
]

# 2. Choose a name for the final, combined file.
output_filename = 'merged_specific_files.txt'

# --- Script Logic ---

# Step 1: Read and merge files into a variable and a file.
merged_content = ""
try:
    print(f"Processing {len(specific_files_to_merge)} files...")
    for filename in specific_files_to_merge:
        header = f'# {"-"*15} START OF FILE: {filename} {"-"*15}\n\n'
        merged_content += header
        try:
            with open(filename, 'r', encoding='utf-8') as infile:
                merged_content += infile.read()
            footer = f'\n\n# {"-"*15} END OF FILE: {filename} {"-"*15}\n\n'
            merged_content += footer
        except FileNotFoundError:
            error_message = f'# !!! ERROR: File not found at path: {filename} !!!\n\n'
            print(f"⚠️  Warning: File not found at '{filename}'. It will be skipped.")
            merged_content += error_message
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        outfile.write(merged_content)
    print(f"✅ Success! Merged the specified files into '{output_filename}'.")
except Exception as e:
    print(f"❌ An error occurred during file processing: {e}")
    sys.exit(1)

# Step 2: Copy the merged content to the clipboard.
try:
    pyperclip.copy(merged_content)
    print("📋 Content successfully copied to clipboard.")
except pyperclip.PyperclipException:
    print("❌ Error copying to clipboard. Please ensure a clipboard utility (like 'xclip' on Linux) is installed.")
    sys.exit(1)

print("\n✨ Done! Merged content is in the output file and your clipboard.")




