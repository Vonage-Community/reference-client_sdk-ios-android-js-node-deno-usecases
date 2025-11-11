require 'xcodeproj'

project_path = 'VonageSDKClientVOIPExample.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Get the main group
main_group = project.main_group['VonageSDKClientVOIPExample']

# Create Core group
core_group = main_group.new_group('Core', 'Core')
# Create Theme group
theme_group = main_group.new_group('Theme', 'Theme')
# Create Views group  
views_group = main_group.new_group('Views', 'Views')

# Add files
files_to_add = [
  ['VonageVoiceApp.swift', main_group],
  ['Core/CoreContext.swift', core_group],
  ['Core/VoiceClientManager.swift', core_group],
  ['Theme/AppTheme.swift', theme_group],
  ['Views/LoginView.swift', views_group],
  ['Views/MainView.swift', views_group],
  ['Views/CallView.swift', views_group],
  ['Views/DialerView.swift', views_group]
]

files_to_add.each do |file_path, group|
  file_ref = group.new_file("VonageSDKClientVOIPExample/#{file_path}")
  target.add_file_references([file_ref])
  puts "✅ Added #{file_path}"
end

project.save
puts "\n🎉 All files added successfully!"
