require 'json'

package = JSON.parse(File.read(File.join(__dir__, '../../package.json')))

Pod::Spec.new do |s|
  s.name         = "RCTIndoorAtlas"
  s.version      = package['version']
  s.summary      = package['description']

  s.homepage     = package['homepage']
  s.authors      = package['author']
  s.license      = package['license']
  s.platform     = :ios, "9.0"

  s.source         = { :git => '' }
  s.source_files   = '**/*.{h,m}'
  s.preserve_paths = '**/*.{h,m}'

  s.ios.vendored_frameworks = 'IndoorAtlas/IndoorAtlas.xcframework'

  s.dependency 'RCTCordova'
end
