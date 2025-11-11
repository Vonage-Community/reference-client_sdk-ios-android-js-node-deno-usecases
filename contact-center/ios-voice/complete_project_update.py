#!/usr/bin/env python3
"""
Complete project update script:
1. Remove old UIKit file references
2. Bump iOS deployment target to 16.0
3. Add new SwiftUI files to project
"""

import re
import uuid

PROJECT_FILE = 'VonageSDKClientVOIPExample.xcodeproj/project.pbxproj'

# Old file IDs to remove
OLD_FILE_IDS = [
    'D1215926299980E2001BB563',  # CallController.swift
    'D1215929299982A4001BB563',  # CallController+VGVoiceDelegate.swift
    'D1521C49299DA37B00E7D572',  # CallController+CXProviderDelegate.swift
    'D121593229998536001BB563',  # Call.swift
    'D121593829998FE6001BB563',  # User.swift
    'D121593C2999A2A6001BB563',  # Connection.swift
    'D1F243892981902900C49B3F',  # UserController.swift
    'D1521C43299C395F00E7D572',  # CircularButton.swift
    'D1521C45299C396800E7D572',  # Old DialerView.swift
    'D1521C47299C410A00E7D572',  # CircularRingView.swift
    'D118E6DF29E9EA9C0039EABA',  # CallVisualView.swift
    'D1F2438E2987370B00C49B3F',  # ActveCallViewController.swift
    'D1F24387298187C600C49B3F',  # LoginViewController.swift
    'D1F243762981846C00C49B3F',  # DialerViewController.swift
    'FEB9E7752A4CA815003C2B62',  # BaseViewController.swift
]

OLD_BUILD_IDS = [
    'D1215927299980E2001BB563',
    'D121592A299982A4001BB563',
    'D1521C4A299DA37B00E7D572',
    'D121593329998536001BB563',
    'D121593929998FE6001BB563',
    'D121593D2999A2A6001BB563',
    'D1F2438A2981902900C49B3F',
    'D1521C44299C395F00E7D572',
    'D1521C46299C396800E7D572',
    'D1521C48299C410A00E7D572',
    'D118E6E029E9EA9C0039EABA',
    'D1F2438F2987370B00C49B3F',
    'D1F24388298187C600C49B3F',
    'D1F243772981846C00C49B3F',
    'FEB9E7762A4CA815003C2B62',
    'D1F2437F2981846E00C49B3F',  # LaunchScreen.storyboard in Resources
]

# New files to add
NEW_FILES = [
    ('VonageSDKClientVOIPExample/VonageVoiceApp.swift', 'VonageVoiceApp.swift'),
    ('VonageSDKClientVOIPExample/Core/CoreContext.swift', 'CoreContext.swift'),
    ('VonageSDKClientVOIPExample/Core/VoiceClientManager.swift', 'VoiceClientManager.swift'),
    ('VonageSDKClientVOIPExample/Theme/AppTheme.swift', 'AppTheme.swift'),
    ('VonageSDKClientVOIPExample/Views/LoginView.swift', 'LoginView.swift'),
    ('VonageSDKClientVOIPExample/Views/MainView.swift', 'MainView.swift'),
    ('VonageSDKClientVOIPExample/Views/CallView.swift', 'CallView.swift'),
    ('VonageSDKClientVOIPExample/Views/DialerView.swift', 'DialerView.swift'),
]

def generate_uuid():
    """Generate a UUID in Xcode format (24 hex chars uppercase)"""
    return uuid.uuid4().hex[:24].upper()

def read_project():
    with open(PROJECT_FILE, 'r') as f:
        return f.read()

def write_project(content):
    with open(PROJECT_FILE, 'w') as f:
        f.write(content)

def remove_old_references(content):
    """Remove old UIKit file references"""
    print("🗑️  Removing old UIKit file references...")
    
    all_old_ids = OLD_FILE_IDS + OLD_BUILD_IDS
    
    # Remove individual entry lines (complete entries with braces)
    for old_id in all_old_ids:
        # Match complete entries: ID /* ... */ = { ... };
        pattern = rf'\t\t{re.escape(old_id)} /\*[^*]*\*/ = \{{[^}}]*\}};\n'
        matches = re.findall(pattern, content)
        for match in matches:
            content = content.replace(match, '')
            print(f"  Removed entry: {old_id}")
    
    # Remove from file lists (references without full entries)
    for old_id in all_old_ids:
        pattern = rf'\t\t\t\t{re.escape(old_id)} /\*[^*]*\*/,\n'
        matches = re.findall(pattern, content)
        for match in matches:
            content = content.replace(match, '')
    
    # Remove LaunchScreen.storyboard variant group
    pattern = r'\t\tD1F2437D2981846E00E7D572 /\* LaunchScreen\.storyboard \*/ = \{[^}]*\};\n'
    content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    return content

def bump_deployment_target(content):
    """Update iOS deployment target to 16.0"""
    print("\n📱 Bumping iOS deployment target to 16.0...")
    
    # Update IPHONEOS_DEPLOYMENT_TARGET
    content = re.sub(
        r'IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;',
        'IPHONEOS_DEPLOYMENT_TARGET = 16.0;',
        content
    )
    
    print("  ✅ Set IPHONEOS_DEPLOYMENT_TARGET = 16.0")
    return content

def add_new_files(content):
    """Add new SwiftUI files to project"""
    print("\n✨ Adding new SwiftUI files...")
    
    # Generate UUIDs for all files
    file_refs = {}
    build_files = {}
    
    for filepath, filename in NEW_FILES:
        file_ref_id = generate_uuid()
        build_file_id = generate_uuid()
        file_refs[filepath] = (file_ref_id, filename)
        build_files[filepath] = build_file_id
        print(f"  Generated IDs for {filename}")
    
    # Find the PBXBuildFile section
    build_file_section = re.search(r'(/\* Begin PBXBuildFile section \*/\n)', content)
    if not build_file_section:
        print("❌ Could not find PBXBuildFile section")
        return content
    
    # Add PBXBuildFile entries
    build_entries = []
    for filepath, filename in NEW_FILES:
        file_ref_id, _ = file_refs[filepath]
        build_file_id = build_files[filepath]
        entry = f"\t\t{build_file_id} /* {filename} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* {filename} */; }};\n"
        build_entries.append(entry)
    
    insert_pos = build_file_section.end()
    content = content[:insert_pos] + ''.join(build_entries) + content[insert_pos:]
    
    # Find the PBXFileReference section
    file_ref_section = re.search(r'(/\* Begin PBXFileReference section \*/\n)', content)
    if not file_ref_section:
        print("❌ Could not find PBXFileReference section")
        return content
    
    # Add PBXFileReference entries
    ref_entries = []
    for filepath, filename in NEW_FILES:
        file_ref_id, _ = file_refs[filepath]
        entry = f"\t\t{file_ref_id} /* {filename} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {filename}; sourceTree = \"<group>\"; }};\n"
        ref_entries.append(entry)
    
    insert_pos = file_ref_section.end()
    content = content[:insert_pos] + ''.join(ref_entries) + content[insert_pos:]
    
    # Find the main group (VonageSDKClientVOIPExample)
    main_group_pattern = r'(D1F243702981846C00C49B3F /\* VonageSDKClientVOIPExample \*/ = \{[^}]*children = \(\n)'
    main_group = re.search(main_group_pattern, content, re.DOTALL)
    
    if main_group:
        # Add file references to main group
        group_entries = []
        
        # Add VonageVoiceApp.swift to root
        filepath, filename = NEW_FILES[0]  # VonageVoiceApp.swift
        file_ref_id, _ = file_refs[filepath]
        group_entries.append(f"\t\t\t\t{file_ref_id} /* {filename} */,\n")
        
        insert_pos = main_group.end()
        content = content[:insert_pos] + ''.join(group_entries) + content[insert_pos:]
    
    # Create Core group
    core_group_id = generate_uuid()
    core_group = f"\t\t{core_group_id} /* Core */ = {{\n"
    core_group += "\t\t\tisa = PBXGroup;\n"
    core_group += "\t\t\tchildren = (\n"
    
    for filepath, filename in NEW_FILES[1:3]:  # CoreContext, VoiceClientManager
        file_ref_id, _ = file_refs[filepath]
        core_group += f"\t\t\t\t{file_ref_id} /* {filename} */,\n"
    
    core_group += "\t\t\t);\n"
    core_group += "\t\t\tpath = Core;\n"
    core_group += "\t\t\tsourceTree = \"<group>\";\n"
    core_group += "\t\t};\n"
    
    # Create Theme group
    theme_group_id = generate_uuid()
    theme_group = f"\t\t{theme_group_id} /* Theme */ = {{\n"
    theme_group += "\t\t\tisa = PBXGroup;\n"
    theme_group += "\t\t\tchildren = (\n"
    
    filepath, filename = NEW_FILES[3]  # AppTheme
    file_ref_id, _ = file_refs[filepath]
    theme_group += f"\t\t\t\t{file_ref_id} /* {filename} */,\n"
    
    theme_group += "\t\t\t);\n"
    theme_group += "\t\t\tpath = Theme;\n"
    theme_group += "\t\t\tsourceTree = \"<group>\";\n"
    theme_group += "\t\t};\n"
    
    # Create Views group
    views_group_id = generate_uuid()
    views_group = f"\t\t{views_group_id} /* Views */ = {{\n"
    views_group += "\t\t\tisa = PBXGroup;\n"
    views_group += "\t\t\tchildren = (\n"
    
    for filepath, filename in NEW_FILES[4:]:  # All view files
        file_ref_id, _ = file_refs[filepath]
        views_group += f"\t\t\t\t{file_ref_id} /* {filename} */,\n"
    
    views_group += "\t\t\t);\n"
    views_group += "\t\t\tpath = Views;\n"
    views_group += "\t\t\tsourceTree = \"<group>\";\n"
    views_group += "\t\t};\n"
    
    # Add groups to main group
    if main_group:
        insert_pos = main_group.end()
        group_refs = f"\t\t\t\t{core_group_id} /* Core */,\n\t\t\t\t{theme_group_id} /* Theme */,\n\t\t\t\t{views_group_id} /* Views */,\n"
        content = content[:insert_pos] + group_refs + content[insert_pos:]
    
    # Insert group definitions before End PBXGroup
    end_group = re.search(r'(/\* End PBXGroup section \*/)', content)
    if end_group:
        insert_pos = end_group.start()
        content = content[:insert_pos] + core_group + theme_group + views_group + content[insert_pos:]
    
    # Add to Sources build phase
    sources_phase = re.search(r'(D1F243712981846C00C49B3F /\* Sources \*/ = \{[^}]*files = \(\n)', content, re.DOTALL)
    if sources_phase:
        source_entries = []
        for filepath in [f[0] for f in NEW_FILES]:
            build_file_id = build_files[filepath]
            filename = filepath.split('/')[-1]
            source_entries.append(f"\t\t\t\t{build_file_id} /* {filename} in Sources */,\n")
        
        insert_pos = sources_phase.end()
        content = content[:insert_pos] + ''.join(source_entries) + content[insert_pos:]
    
    print(f"  ✅ Added {len(NEW_FILES)} new files to project")
    return content

def main():
    print("=" * 70)
    print("📦 Complete iOS Voice Project Update")
    print("=" * 70)
    print()
    
    # Read project
    content = read_project()
    
    # Step 1: Remove old references
    content = remove_old_references(content)
    
    # Step 2: Bump deployment target
    content = bump_deployment_target(content)
    
    # Step 3: Add new files
    content = add_new_files(content)
    
    # Write updated project
    write_project(content)
    
    print()
    print("=" * 70)
    print("✅ Project Update Complete!")
    print("=" * 70)
    print()
    print("Summary:")
    print("  • Removed old UIKit file references")
    print("  • Bumped iOS deployment target to 16.0")
    print("  • Added 8 new SwiftUI files")
    print()
    print("Next: Build the project")
    print("  xcodebuild -workspace VonageSDKClientVOIPExample.xcworkspace \\")
    print("    -scheme VonageSDKClientVOIPExample -configuration Debug build")
    print()

if __name__ == '__main__':
    main()
