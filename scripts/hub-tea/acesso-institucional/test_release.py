import unittest
from unittest.mock import Mock,patch
from release import Release,WORKER,R2,ACCOUNT,ARCHIVE,ARCHIVE_KEY,upload_metadata,index_headers,preview_headers
from build import build,ScriptBlocks
from card_labels import LabelsRelease
class ReleaseScope(unittest.TestCase):
 def setUp(self):self.release=Release.__new__(Release)
 def test_other_worker_is_refused(self):
  with self.assertRaisesRegex(ValueError,'API_TARGET_REFUSED'):self.release.request(f'/accounts/{ACCOUNT}/workers/scripts/csv-auth','PUT',b'')
 def test_other_object_is_refused(self):
  with self.assertRaisesRegex(ValueError,'WRITE_TARGET_REFUSED'):self.release.request(R2+'/objects/tea/peca-painel.webp','PUT',b'')
 def test_metadata_write_is_refused(self):
  with self.assertRaisesRegex(ValueError,'POST_TARGET_REFUSED'):self.release.request(WORKER+'/settings','POST',b'')
 def test_deletion_is_refused(self):
  with self.assertRaisesRegex(ValueError,'METHOD_REFUSED'):self.release.request(R2+'/objects/tea%2Findex.html','DELETE')
 def test_global_purge_is_not_in_commands(self):
  import inspect
  self.assertNotIn('purge_everything',inspect.getsource(Release.purge))
 def test_unknown_settings_abort(self):
  with self.assertRaisesRegex(ValueError,'UNKNOWN_SETTINGS'):upload_metadata({'new_field':True})
 def test_observability_limits_and_usage_survive_upload(self):
  settings={'bindings':[],'usage_model':'standard','observability':{'enabled':True},'limits':{'cpu_ms':30000},'annotations':{'workers/triggered_by':'version_upload'}}
  metadata=upload_metadata(settings)
  for key in ('observability','limits','usage_model'):self.assertEqual(metadata[key],settings[key])
  self.assertNotIn('annotations',metadata)
 def test_secret_binding_is_kept_by_type_without_value(self):
  settings={'bindings':[{'type':'secret_text','name':'TOKEN'}]}
  self.assertEqual(upload_metadata(settings)['keep_bindings'],['secret_text'])
  self.assertEqual(upload_metadata(settings)['bindings'],[])
 def test_html_metadata_preserves_original_content_type(self):
  self.assertEqual(index_headers({'http_metadata':{'contentType':'text/html'},'custom_metadata':{},'storage_class':'Standard'})['Content-Type'],'text/html')
 def test_custom_metadata_requires_review(self):
  with self.assertRaisesRegex(ValueError,'CUSTOM_METADATA'):index_headers({'http_metadata':{'contentType':'text/html'},'custom_metadata':{'new':'value'},'storage_class':'Standard'})
 def test_unexpected_http_metadata_requires_review(self):
  with self.assertRaisesRegex(ValueError,'HTTP_METADATA'):index_headers({'http_metadata':{'contentType':'text/html','cacheControl':'public'},'custom_metadata':{},'storage_class':'Standard'})
 def test_neutralization_requires_remote_archive(self):
  item=self.release;item.verify_worker=Mock();item.inventory=Mock();item.check_remote_archive=Mock(side_effect=ValueError('ARCHIVE_NOT_VERIFIED'));item.request=Mock()
  with self.assertRaisesRegex(ValueError,'ARCHIVE_NOT_VERIFIED'):item.neutralize_preview()
  item.request.assert_not_called()
 def test_release_cannot_rewrite_archive(self):
  with self.assertRaisesRegex(ValueError,'API_TARGET_REFUSED'):self.release.request(ARCHIVE+'/objects/'+ARCHIVE_KEY,'PUT',b'')
 def test_preview_stays_webp_with_same_metadata(self):
  self.assertEqual(preview_headers({'http_metadata':{'contentType':'image/webp'},'custom_metadata':{},'storage_class':'Standard'})['Content-Type'],'image/webp')
 def test_preview_html_disguised_as_image_is_refused(self):
  with self.assertRaisesRegex(ValueError,'HTTP_METADATA'):preview_headers({'http_metadata':{'contentType':'text/html'},'custom_metadata':{},'storage_class':'Standard'})
 def test_upper_case_scripts_are_preserved(self):
  source=b'<html><head></head><body><SCRIPT>const kept = true;</SCRIPT><span class="peca peca-f"><span class="folha"><img src="peca-jornada.webp"><span>Ampliar</span></span></span></body></html>'
  changed,_=build(source)
  self.assertIn(b'<SCRIPT>const kept = true;</SCRIPT>',changed)
  self.assertNotIn(b'peca-jornada.webp',changed)
 def test_script_parser_preserves_case_attributes_and_closing_space(self):
  for script in ('<SCRIPT>const kept=true;</SCRIPT>','<script src="safe.js"></script >','<script type="text/javascript">let x="<tag>";</script\n>'):
   with self.subTest(script=script):self.assertEqual(ScriptBlocks('<main>'+script+'</main>').blocks,[script])
 def test_script_parser_does_not_treat_commented_script_as_executable(self):
  self.assertEqual(ScriptBlocks('<!-- <script>ignored</script> --><script>real</script>').blocks,['<script>real</script>'])
class LabelsScope(unittest.TestCase):
 def test_labels_can_only_write_index(self):
  item=LabelsRelease.__new__(LabelsRelease)
  with patch.object(Release,'request',return_value=(b'OK',{})) as parent:
   item.request(R2+'/objects/tea/index.html','PUT',b'HTML')
   parent.assert_called_once()
 def test_labels_cannot_write_worker_assets_metadata_or_purge(self):
  item=LabelsRelease.__new__(LabelsRelease)
  for target,method in ((WORKER,'PUT'),(R2+'/objects/tea/peca-jornada.webp','PUT'),(WORKER+'/settings','POST'),('/zones/test/purge_cache','POST'),(R2+'/objects/tea/index.html','DELETE')):
   with self.subTest(target=target,method=method):
    with self.assertRaisesRegex(ValueError,'LABELS_WRITE_TARGET_REFUSED'):item.request(target,method,b'')

if __name__=='__main__':unittest.main()
