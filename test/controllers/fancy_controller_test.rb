require 'test_helper'

class FancyControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get fancy_index_url
    assert_response :success
  end

end
