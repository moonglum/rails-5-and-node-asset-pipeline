# TODO: I should be in a Railtie, but this is prototyping, you know?
module ActionView
  module Helpers
    TYPES_WITH_MANIFEST = %i(stylesheet javascript image)

    def compute_asset_path(source, options = {})
      if TYPES_WITH_MANIFEST.include? options[:type]
        manifest = manifest_file_for_type(options[:type])
        manifest.fetch(source)
      else
        dir = ASSET_PUBLIC_DIRECTORIES[options[:type]] || ""
        File.join(dir, source)
      end
    end

    private

    def manifest_file_for_type(type)
      JSON.parse(File.read("public/assets/manifests/#{type}.json"))
    end
  end
end
